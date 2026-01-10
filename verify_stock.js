const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
const TIMESTAMP = Date.now();
const EMAIL = `admin_${TIMESTAMP}@test.com`;
const PASSWORD = 'password123';
const SALON_NAME = `Test Salon ${TIMESTAMP}`;

async function runTest() {
    try {
        console.log('--- STARTING STOCK VERIFICATION TEST ---');

        // 1. Register Salon & Admin
        console.log('1. Registering new Salon/Admin...');
        const registerRes = await axios.post(`${BASE_URL}/auth/register`, {
            name: SALON_NAME,
            salonName: SALON_NAME,
            email: EMAIL,
            password: PASSWORD,
            phone: '11999999999'
        });
        
        const token = registerRes.data.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const salonId = registerRes.data.salon.id;
        console.log(`   Registered successfully. Salon ID: ${salonId}`);

        // 2. Create Service
        console.log('2. Creating Service...');
        const serviceRes = await axios.post(`${BASE_URL}/services`, {
            name: 'Test Cut',
            price: 50.00,
            duration: 60
        }, config);
        const service = serviceRes.data;
        console.log(`   Service created: ${service.name} (${service._id})`);

        // 3. Create Professional
        console.log('3. Creating Professional...');
        // Create working hours for every day (0=Sunday, 6=Saturday)
        const workingHours = {};
        for (let i = 0; i <= 6; i++) {
            workingHours[String(i)] = {
                open: '08:00',
                close: '20:00',
                isOpen: true,
                breaks: []
            };
        }

        const profRes = await axios.post(`${BASE_URL}/professionals`, {
            name: 'Test Pro',
            workingHours: workingHours
        }, config);
        const professional = profRes.data;
        console.log(`   Professional created: ${professional.name} (${professional._id})`);

        // 4. Create Product
        console.log('4. Creating Product...');
        const productRes = await axios.post(`${BASE_URL}/admin/products`, {
            name: `Test Product ${TIMESTAMP}`,
            price: 100.00,
            stock: 10,
            active: true
        }, config);
        const product = productRes.data;
        console.log(`   Product created: ${product.name} (${product._id}), Stock: ${product.stock}`);

        // 5. Create Appointment
        console.log('5. Creating Appointment...');
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];
        
        // Ensure we book for a time that is open. 12:00 is safe given 08:00-20:00.
        const aptPayload = {
            salao_id: salonId,
            profissional_id: professional._id,
            servicos: [service._id],
            data: dateStr,
            hora_inicio: '12:00',
            cliente: 'Test Client',
            telefone: '11988888888',
            origin: 'panel'
        };
        
        const aptRes = await axios.post(`${BASE_URL}/agendamentos`, aptPayload, config);
        // The response structure might be { message: '...', agendamento: { ... } } or just the object
        const appointmentId = aptRes.data.agendamento ? aptRes.data.agendamento._id : aptRes.data._id;
        console.log(`   Appointment created: ${appointmentId}`);

        // 6. Finish Appointment with Product
        console.log('6. Finishing Appointment with Product...');
        const usedQuantity = 2;
        const finishRes = await axios.put(`${BASE_URL}/appointments/${appointmentId}/finish`, {
            finalPrice: 50.00, // Service price
            paymentMethod: 'money',
            products: [{
                productId: product._id,
                name: product.name,
                price: product.price,
                quantity: usedQuantity
            }]
        }, config);
        console.log('   Appointment finished successfully.');

        // 7. Verify Stock Deduction
        console.log('7. Verifying Stock Deduction...');
        const productsRes = await axios.get(`${BASE_URL}/admin/products`, config);
        const updatedProduct = productsRes.data.find(p => p._id === product._id);
        
        console.log(`   Original Stock: ${product.stock}`);
        console.log(`   Used Quantity: ${usedQuantity}`);
        console.log(`   New Stock: ${updatedProduct.stock}`);

        const expectedStock = product.stock - usedQuantity;
        if (updatedProduct.stock === expectedStock) {
            console.log('✅ SUCCESS: Stock deducted correctly.');
        } else {
            console.error('❌ FAILURE: Stock mismatch.');
            process.exit(1);
        }

        // 8. Verify Product Link in Appointment
        console.log('8. Verifying Product Link in Appointment...');
        // We can check the finishRes or fetch appointment again
        const finishedApt = finishRes.data;
        // Depending on response, it might be the updated appointment or a message
        // If it's the appointment object:
        let aptProducts = finishedApt.products;
        if (!aptProducts) {
             // Fetch again if not returned
             // Assuming we can get it via some endpoint or rely on finishRes returning the doc
             // adminController.finishAppointment returns `res.json(appointment)`
             aptProducts = finishedApt.products;
        }

        if (aptProducts && aptProducts.length === 1 && aptProducts[0].productId === product._id && aptProducts[0].quantity === usedQuantity) {
            console.log('✅ SUCCESS: Product linked correctly to appointment.');
        } else {
            console.error('❌ FAILURE: Product linking mismatch.', JSON.stringify(aptProducts, null, 2));
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ TEST FAILED:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        if (error.response && error.response.status === 404) {
             console.error('Endpoint not found. Check if server is running and routes are correct.');
        }
        process.exit(1);
    }
}

runTest();
