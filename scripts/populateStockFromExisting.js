const { query } = require('../config/database');

async function populateStockFromExisting() {
  try {
    console.log('=== POPULATING STOCK TRANSACTIONS FROM EXISTING DATA ===\n');

    // Clear manually added test transactions
    console.log('Clearing manual test transactions...');
    await query(`
      DELETE FROM stock_transactions 
      WHERE reference_type IN ('OPENING_STOCK', 'GRN', 'PRODUCTION', 'DISPATCH')
    `);
    console.log('✅ Cleared\n');

    // 1. Populate from existing GRN items
    console.log('1. Processing GRN items (Raw Material Receipts)...');
    const grnResult = await query(`
      SELECT 
        g.invoice_date,
        gi.item_id,
        gi.accepted_quantity,
        gi.rate,
        g.id as grn_id,
        g.grn_number,
        i.item_name,
        c.category_name
      FROM scrap_grn_items gi
      JOIN scrap_grn g ON gi.grn_id = g.id
      JOIN items i ON gi.item_id = i.id
      JOIN categories c ON i.category_id = c.id
      WHERE c.category_name IN ('Raw Material', 'Minerals')
      ORDER BY g.invoice_date
    `);

    for (const row of grnResult.rows) {
      await query(`
        SELECT create_stock_transaction($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        row.invoice_date,
        'RECEIPT',
        row.item_id,
        row.accepted_quantity,
        row.rate,
        'GRN',
        row.grn_id,
        `GRN Receipt - ${row.grn_number}`
      ]);
    }
    console.log(`   ✅ Created ${grnResult.rows.length} RECEIPT transactions from GRN\n`);

    // 2. Populate from existing Melting Processes (Raw Material Issues)
    console.log('2. Processing Melting Processes (Raw Material Issues)...');
    const meltingIssueResult = await query(`
      SELECT 
        mp.melting_date,
        mp.item_id,
        mp.consumed_quantity,
        COALESCE(mp.rate, 0) as rate,
        mp.id,
        mp.heat_number,
        i.item_name,
        c.category_name
      FROM melting_processes mp
      JOIN items i ON mp.item_id = i.id
      JOIN categories c ON i.category_id = c.id
      WHERE mp.consumed_quantity > 0
      AND c.category_name IN ('Raw Material', 'Minerals')
      ORDER BY mp.melting_date
    `);

    for (const row of meltingIssueResult.rows) {
      await query(`
        SELECT create_stock_transaction($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        row.melting_date,
        'ISSUE',
        row.item_id,
        row.consumed_quantity,
        row.rate,
        'MELTING',
        row.id,
        `Melting Process - Heat No: ${row.heat_number}`
      ]);
    }
    console.log(`   ✅ Created ${meltingIssueResult.rows.length} ISSUE transactions from Melting\n`);

    // 3. Populate WIP outputs from Melting Process
    console.log('3. Processing WIP Outputs from Melting...');
    const wipResult = await query(`
      SELECT 
        mp.melting_date,
        mp.output_item_id,
        mp.output_quantity,
        COALESCE(mp.output_rate, 0) as rate,
        mp.id,
        mp.heat_number
      FROM melting_processes mp
      WHERE mp.output_item_id IS NOT NULL 
      AND mp.output_quantity > 0
      ORDER BY mp.melting_date
    `);

    for (const row of wipResult.rows) {
      if (row.output_item_id) {
        await query(`
          SELECT create_stock_transaction($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          row.melting_date,
          'RECEIPT',
          row.output_item_id,
          row.output_quantity,
          row.rate,
          'MELTING',
          row.id,
          `WIP Output - Heat No: ${row.heat_number}`
        ]);
      }
    }
    console.log(`   ✅ Created ${wipResult.rows.length} WIP RECEIPT transactions\n`);

    // 4. Populate from Heat Treatment (WIP Issues + Finished Goods Receipts)
    console.log('4. Processing Heat Treatment...');
    const htResult = await query(`
      SELECT 
        ht.treatment_date,
        ht.input_item_id,
        ht.input_quantity,
        COALESCE(ht.input_rate, 0) as input_rate,
        ht.output_item_id,
        ht.output_quantity,
        COALESCE(ht.output_rate, 0) as output_rate,
        ht.id,
        ht.lot_number
      FROM heat_treatment ht
      ORDER BY ht.treatment_date
    `);

    let htIssue = 0, htReceipt = 0;
    for (const row of htResult.rows) {
      // Issue WIP (input)
      if (row.input_item_id && row.input_quantity > 0) {
        await query(`
          SELECT create_stock_transaction($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          row.treatment_date,
          'ISSUE',
          row.input_item_id,
          row.input_quantity,
          row.input_rate,
          'HEAT_TREATMENT',
          row.id,
          `Heat Treatment Input - Lot: ${row.lot_number}`
        ]);
        htIssue++;
      }

      // Receipt Finished Goods (output)
      if (row.output_item_id && row.output_quantity > 0) {
        await query(`
          SELECT create_stock_transaction($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          row.treatment_date,
          'RECEIPT',
          row.output_item_id,
          row.output_quantity,
          row.output_rate,
          'HEAT_TREATMENT',
          row.id,
          `Finished Goods - Lot: ${row.lot_number}`
        ]);
        htReceipt++;
      }
    }
    console.log(`   ✅ Created ${htIssue} WIP ISSUE + ${htReceipt} Finished Goods RECEIPT transactions\n`);

    // 5. Populate from Dispatches (Finished Goods Issues)
    console.log('5. Processing Dispatches (Finished Goods Issues)...');
    const dispatchResult = await query(`
      SELECT 
        d.dispatch_date,
        di.item_id,
        di.bags as quantity,
        COALESCE(di.rate, 0) as rate,
        d.id as dispatch_id,
        o.order_number,
        i.item_name,
        c.category_name
      FROM dispatch_items di
      JOIN dispatches d ON di.dispatch_id = d.id
      JOIN orders o ON d.order_id = o.id
      JOIN items i ON di.item_id = i.id
      JOIN categories c ON i.category_id = c.id
      WHERE c.category_name LIKE '%Finished%'
      ORDER BY d.dispatch_date
    `);

    for (const row of dispatchResult.rows) {
      await query(`
        SELECT create_stock_transaction($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        row.dispatch_date,
        'ISSUE',
        row.item_id,
        row.quantity,
        row.rate,
        'DISPATCH',
        row.dispatch_id,
        `Dispatch - ${row.order_number}`
      ]);
    }
    console.log(`   ✅ Created ${dispatchResult.rows.length} Finished Goods ISSUE transactions\n`);

    // Summary
    console.log('=== SUMMARY ===');
    const summary = await query(`
      SELECT 
        reference_type,
        transaction_type,
        COUNT(*) as count,
        SUM(quantity) as total_qty,
        SUM(amount) as total_amount
      FROM stock_transactions
      GROUP BY reference_type, transaction_type
      ORDER BY reference_type, transaction_type
    `);
    console.table(summary.rows);

    // Test the report
    console.log('\n=== TESTING STOCK STATEMENT ===');
    const today = new Date().toISOString().split('T')[0];
    const sixtyDaysAgo = new Date(Date.now() - 60*24*60*60*1000).toISOString().split('T')[0];
    
    const reportResult = await query(`
      SELECT 
        item_name,
        category_name,
        opening_qty,
        receipt_qty,
        issue_qty,
        closing_qty,
        closing_amount
      FROM get_stock_statement_report($1, $2, NULL)
      WHERE opening_qty > 0 OR receipt_qty > 0 OR issue_qty > 0 OR closing_qty > 0
      ORDER BY category_name, item_name
    `, [sixtyDaysAgo, today]);

    console.log('\nStock Statement (Last 60 days):');
    console.table(reportResult.rows);

    console.log('\n✅ Stock transactions populated successfully!');
    console.log('\n📝 All future GRN, Melting, Heat Treatment, and Dispatch entries');
    console.log('   will automatically create stock transactions via triggers.');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
    process.exit(1);
  }
}

populateStockFromExisting();
