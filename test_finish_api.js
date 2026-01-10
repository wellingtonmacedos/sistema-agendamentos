const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
const AUTH_EMAIL = 'admin@salao.com';
const AUTH_PASS = 'admin123';

async function runTest() {
    try {
        console.log('1. Logging in...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: AUTH_EMAIL,
            password: AUTH_PASS
        });
        const token = loginRes.data.token;
        const headers = { Authorization: `Bearer ${token}` };
        console.log('Login successful.');

        // 1.5 Get Salon ID
        const meRes = await axios.get(`${BASE_URL}/me`, { headers });
        const salonId = meRes.data.id;
        console.log(`Salon ID: ${salonId}`);

        // 2. Get Products to pick one
        console.log('2. Fetching products...');
        const productsRes = await axios.get(`${BASE_URL}/admin/products`, { headers });
        let product = productsRes.data[0];
        
        if (!product) {
            console.log('No products found. Creating one...');
            const newProd = await axios.post(`${BASE_URL}/admin/products`, {
                name: 'Test Product',
                price: 50,
                cost: 20,
                stock: 10,
                active: true
            }, { headers });
            product = newProd.data;
        }
        
        console.log(`Using Product: ${product.name} (ID: ${product._id}) Stock: ${product.stock}`);
        const initialStock = product.stock;

        // 3. Create Appointment
        console.log('3. Creating Appointment...');
        const profRes = await axios.get(`${BASE_URL}/professionals?salao_id=${salonId}`, { headers });
        const servRes = await axios.get(`${BASE_URL}/services?salao_id=${salonId}`, { headers });
        
        if (profRes.data.length === 0 || servRes.data.length === 0) {
            throw new Error('No professionals or services found.');
        }

        // Generate random time to avoid collision
        const randomDay = Math.floor(Math.random() * 28) + 1;
        const randomHour = Math.floor(Math.random() * 8) + 9; // 9 to 17
        const date = `2026-04-${String(randomDay).padStart(2, '0')}`;
        const time = `${String(randomHour).padStart(2, '0')}:00`;

        console.log(`Using Date: ${date}, Time: ${time}`);

        const appData = {
            salao_id: salonId,
            profissional_id: profRes.data[0]._id,
            servicos: [servRes.data[0]._id],
            data: date,
            hora_inicio: time,
            cliente: 'Test Client',
            telefone: '11999999999'
        };

        const createRes = await axios.post(`${BASE_URL}/agendamentos`, appData);
        // Note: createRes.data is the appointment object directly
        const appointmentId = createRes.data._id; 
        console.log(`Appointment Created: ${appointmentId}`);

        // 4. Finish Appointment with Product
        console.log('4. Finishing Appointment...');
        const customPrice = 45;
        const finishPayload = {
            finalPrice: 100 + customPrice, 
            paymentMethod: 'money',
            products: [
                {
                    productId: product._id,
                    name: product.name,
                    price: customPrice,
                    quantity: 1
                }
            ]
        };

        const finishRes = await axios.put(`${BASE_URL}/appointments/${appointmentId}/finish`, finishPayload, { headers });
        console.log('Finish Response:', finishRes.status);
        
        // 5. Verify Appointment Data
        const updatedApp = finishRes.data;
        console.log('Updated App Products:', JSON.stringify(updatedApp.products, null, 2));
        
        if (!updatedApp.products || updatedApp.products.length === 0) {
            console.error('FAIL: Products not saved in appointment.');
        } else {
            console.log('PASS: Products saved in appointment.');
            if (Number(updatedApp.products[0].price) === customPrice) {
                 console.log('PASS: Custom price saved correctly.');
            } else {
                 console.error(`FAIL: Custom price mismatch. Expected ${customPrice}, got ${updatedApp.products[0].price}`);
            }
        }

        // 6. Verify Stock Deduction
        console.log('6. Verifying Stock...');
        const productsRes2 = await axios.get(`${BASE_URL}/admin/products`, { headers });
        const updatedProduct = productsRes2.data.find(p => p._id === product._id);
        
        console.log(`Old Stock: ${initialStock}, New Stock: ${updatedProduct.stock}`);
        
        if (updatedProduct.stock === initialStock - 1) {
            console.log('PASS: Stock deducted correctly.');
        } else {
            console.error('FAIL: Stock NOT deducted.');
        }

    } catch (error) {
        console.error('Test Failed:', error.response ? error.response.data : error.message);
    }
}

runTest();