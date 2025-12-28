const { query } = require('../config/database');

async function seedDefaultData() {
  console.log('Starting default data seeding...');

  try {
    // 1. Check and create default UOM (Kgs)
    console.log('Checking UOM...');
    let uomResult = await query(
      "SELECT id FROM uom WHERE uom_short_name = 'Kgs'"
    );
    
    let uomId;
    if (uomResult.rows.length === 0) {
      console.log('Creating UOM: Kilograms (Kgs)');
      const insertUom = await query(
        "INSERT INTO uom (uom_short_name, uom_description) VALUES ($1, $2) RETURNING id",
        ['Kgs', 'Kilograms']
      );
      uomId = insertUom.rows[0].id;
      console.log(`✓ UOM created with ID: ${uomId}`);
    } else {
      uomId = uomResult.rows[0].id;
      console.log(`✓ UOM already exists with ID: ${uomId}`);
    }

    // 2. Check and create default Category (Minerals)
    console.log('\nChecking Category...');
    let categoryResult = await query(
      "SELECT id FROM categories WHERE category_name = 'Minerals'"
    );
    
    let categoryId;
    if (categoryResult.rows.length === 0) {
      console.log('Creating Category: Minerals');
      const insertCategory = await query(
        "INSERT INTO categories (category_name, description) VALUES ($1, $2) RETURNING id",
        ['Minerals', 'Mineral materials used in steel manufacturing']
      );
      categoryId = insertCategory.rows[0].id;
      console.log(`✓ Category created with ID: ${categoryId}`);
    } else {
      categoryId = categoryResult.rows[0].id;
      console.log(`✓ Category already exists with ID: ${categoryId}`);
    }

    // 3. Check and create default GST Rate (18% - Default)
    console.log('\nChecking GST Rate...');
    let gstResult = await query(
      "SELECT id FROM gst_rates WHERE gst_details = 'Default' AND gst_rate = 18"
    );
    
    let gstRateId;
    if (gstResult.rows.length === 0) {
      console.log('Creating GST Rate: Default (18%)');
      const insertGst = await query(
        `INSERT INTO gst_rates (hsn_code, gst_details, gst_rate, effective_date) 
         VALUES ($1, $2, $3, $4) RETURNING id`,
        ['9999', 'Default', 18, '2025-04-01']
      );
      gstRateId = insertGst.rows[0].id;
      console.log(`✓ GST Rate created with ID: ${gstRateId}`);
    } else {
      gstRateId = gstResult.rows[0].id;
      console.log(`✓ GST Rate already exists with ID: ${gstRateId}`);
    }

    // 4. Create default items
    console.log('\nChecking Items...');
    const defaultItems = [
      { name: 'CARBON', alias: 'C' },
      { name: 'MANGANESE', alias: 'Mn' },
      { name: 'SILICON', alias: 'Si' },
      { name: 'ALUMINIUM', alias: 'Al' },
      { name: 'CALCIUM', alias: 'Ca' }
    ];

    for (const item of defaultItems) {
      const existingItem = await query(
        "SELECT id FROM items WHERE item_name = $1",
        [item.name]
      );

      if (existingItem.rows.length === 0) {
        console.log(`Creating Item: ${item.name}`);
        await query(
          `INSERT INTO items (
            item_name, alias, category_id, uom_id, gst_rate_id
          ) VALUES ($1, $2, $3, $4, $5)`,
          [item.name, item.alias, categoryId, uomId, gstRateId]
        );
        console.log(`✓ Item '${item.name}' created successfully`);
      } else {
        console.log(`✓ Item '${item.name}' already exists`);
      }
    }

    // 5. Create MS Scrap item for GRN and Melting Process tracking
    console.log('\nChecking MS Scrap item...');
    
    // Get Raw Material category
    let rawMaterialCategory = await query(
      "SELECT id FROM categories WHERE category_name = 'Raw Material'"
    );
    
    let rawMaterialCategoryId;
    if (rawMaterialCategory.rows.length === 0) {
      console.log('Creating Category: Raw Material');
      const insertRawMaterial = await query(
        "INSERT INTO categories (category_name, alias) VALUES ($1, $2) RETURNING id",
        ['Raw Material', 'RM']
      );
      rawMaterialCategoryId = insertRawMaterial.rows[0].id;
      console.log(`✓ Raw Material category created with ID: ${rawMaterialCategoryId}`);
    } else {
      rawMaterialCategoryId = rawMaterialCategory.rows[0].id;
      console.log(`✓ Raw Material category exists with ID: ${rawMaterialCategoryId}`);
    }

    // Get KG UOM
    let kgUom = await query(
      "SELECT id FROM uom WHERE uom_short_name = 'KG'"
    );
    
    let kgUomId;
    if (kgUom.rows.length === 0) {
      console.log('Creating UOM: KG (Kilogram)');
      const insertKgUom = await query(
        "INSERT INTO uom (uom_short_name, uom_description) VALUES ($1, $2) RETURNING id",
        ['KG', 'Kilogram']
      );
      kgUomId = insertKgUom.rows[0].id;
      console.log(`✓ KG UOM created with ID: ${kgUomId}`);
    } else {
      kgUomId = kgUom.rows[0].id;
      console.log(`✓ KG UOM exists with ID: ${kgUomId}`);
    }

    // Get GST rate for Iron & Steel (18%)
    let steelGst = await query(
      "SELECT id FROM gst_rates WHERE hsn_code = '7201' LIMIT 1"
    );
    
    let steelGstId;
    if (steelGst.rows.length === 0) {
      console.log('Creating GST Rate: GST 18% on Iron & Steel');
      const insertSteelGst = await query(
        `INSERT INTO gst_rates (hsn_code, gst_details, gst_rate, effective_date) 
         VALUES ($1, $2, $3, $4) RETURNING id`,
        ['7201', 'GST 18% on Iron & Steel', 18, '2023-01-01']
      );
      steelGstId = insertSteelGst.rows[0].id;
      console.log(`✓ GST Rate created with ID: ${steelGstId}`);
    } else {
      steelGstId = steelGst.rows[0].id;
      console.log(`✓ GST Rate exists with ID: ${steelGstId}`);
    }

    // Check and create MS Scrap item
    const msScrapExists = await query(
      "SELECT id FROM items WHERE item_name = 'MS Scrap'"
    );

    if (msScrapExists.rows.length === 0) {
      console.log('Creating Item: MS Scrap');
      await query(
        `INSERT INTO items (
          item_name, alias, category_id, uom_id, gst_rate_id
        ) VALUES ($1, $2, $3, $4, $5)`,
        ['MS Scrap', 'MS-SCRAP', rawMaterialCategoryId, kgUomId, steelGstId]
      );
      console.log('✓ Item "MS Scrap" created successfully');
      console.log('  → This item will be used for tracking scrap inward from GRN and scrap issue for Melting Process');
    } else {
      console.log('✓ Item "MS Scrap" already exists');
    }

    console.log('\n✅ Default data seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   UOM: Kilograms (Kgs) - ID: ${uomId}`);
    console.log(`   Category: Minerals - ID: ${categoryId}`);
    console.log(`   GST Rate: Default (18%) - ID: ${gstRateId}`);
    console.log(`   Items: ${defaultItems.length} mineral items + 1 MS Scrap item`);
    console.log('\n✏️  Note: Users can edit GST Rate details from the GST Rate Master page.');

  } catch (error) {
    console.error('❌ Error seeding default data:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedDefaultData()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDefaultData };
