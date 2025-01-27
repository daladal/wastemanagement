const XLSX = require('xlsx');
const fs   = require('fs');

process.stdin.setEncoding('utf8');
let inputData = '';

process.stdin.on('data', chunk => {
    inputData += chunk;
});

process.stdin.on('end', () => {
    try {
        const data = JSON.parse(inputData);

        const extracted = {
            address: data.address,
            isServiceAvailable: data.wmData.is_service_available,
            products: data.wmData.catalogs.map(catalog => ({
                products: catalog.products.map(product => ({
                    bundle:  product.bundle_type,
                    pricing: product.attributes.map(attr => ({
                        frequency: attr.frequency,
                        q1Base:    attr.pricing.details[0].amount,
                        q1AllIn:   attr.pricing.details[0].all_in_price,
                        q2Base:    attr.pricing.details[1].amount,
                        q2AllIn:   attr.pricing.details[1].all_in_price
                    }))
                }))
            }))
        };

        console.log("Successfully retrieved WM data for", extracted.address);

        const trash = extracted.products[0];
        const recycling = extracted.products[1]; 

        const newRow = {
            'Address':                     extracted.address,
            'WM Service':                  extracted.isServiceAvailable,
            'Residential Base':        `$${trash.products[0].pricing[0].q1Base.toFixed(2)}`,
            'Residential All In':      `$${trash.products[0].pricing[0].q1AllIn.toFixed(2)}`,
            '2 Cans Base':             `$${trash.products[0].pricing[0].q2Base.toFixed(2)}`,
            '2 Cans All In':           `$${trash.products[0].pricing[0].q2AllIn.toFixed(2)}`,
            'Residential Frequency':       trash.products[0].pricing[0].frequency,
            'Recycling Base':          `$${recycling.products[0].pricing[0].q1Base.toFixed(2)}`,
            'Recycling All In':        `$${recycling.products[0].pricing[0].q1AllIn.toFixed(2)}`,
            'RCY 2 Cans Base':         `$${recycling.products[0].pricing[0].q2Base.toFixed(2)}`,
            'RCY 2 Cans All In':       `$${recycling.products[0].pricing[0].q2AllIn.toFixed(2)}`,
            'Bundle':                      recycling.products[0].bundle,
            'RCY Frequency':               recycling.products[0].pricing[0].frequency
        };

        let workbook;
        if (fs.existsSync('/usr/src/app/output.xlsx')) {
            workbook = XLSX.readFile('/usr/src/app/output.xlsx');
        } else {
            workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([Object.keys(newRow)]), 'Sheet1');
        }

        const sheet = workbook.Sheets['Sheet1'];

        const data_rows = XLSX.utils.sheet_to_json(sheet);
        data_rows.push(newRow);
        
        const new_sheet = XLSX.utils.json_to_sheet(data_rows);
        workbook.Sheets['Sheet1'] = new_sheet;

        workbook.Sheets['Sheet1']['!cols'] = [
            { wch: 30 }, // A 
            ...Array(12).fill({ wch: 16 }) // B - M
        ];
        
        XLSX.writeFile(workbook, '/usr/src/app/output.xlsx');
        
        
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
});

process.stdin.on('error', error => {
    console.error('Error reading from stdin:', error);
    process.exit(1);
});