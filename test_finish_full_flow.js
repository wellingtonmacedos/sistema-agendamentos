const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Salon = require('./src/models/Salon');
const Professional = require('./src/models/Professional');
const Service = require('./src/models/Service');
const Product = require('./src/models/Product');
const Appointment = require('./src/models/Appointment');
const User = require('./src/models/User');

const adminController = require('./src/controllers/adminController');

async function testFullFlow() {
    let mongoServer;
    try {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
        console.log('Connected to In-Memory DB');

        // 1. Setup Data
        const salonId = new mongoose.Types.ObjectId();
        
        // Create Product
        const product = new Product({
            salonId,
            name: 'Shampoo Premium',
            price: 50,
            cost: 20,
            stock: 10,
            active: true
        });
        await product.save();
        console.log('Product created:', product.name, 'Stock:', product.stock);

        // Create Professional
        const professional = new Professional({
            salonId,
            name: 'Ana',
            email: 'ana@test.com'
        });
        await professional.save();

        // Create Service
        const service = new Service({
            salonId,
            name: 'Corte',
            price: 100,
            duration: 60
        });
        await service.save();

        // Create Appointment
        const appointment = new Appointment({
            salonId,
            professionalId: professional._id,
            customerName: 'Cliente Teste',
            customerPhone: '123456789',
            date: new Date(),
            startTime: new Date(),
            endTime: new Date(new Date().getTime() + 60*60000),
            services: [{
                _id: service._id,
                name: service.name,
                price: service.price
            }],
            totalPrice: 100,
            status: 'confirmed'
        });
        await appointment.save();
        console.log('Appointment created. Total Price:', appointment.totalPrice);

        // 2. Simulate Finish Request (Controller Test)
        const req = {
            params: { id: appointment._id.toString() },
            user: { salonId: salonId.toString() },
            body: {
                finalPrice: 150, // 100 (Service) + 50 (Product)
                paymentMethod: 'credit_card',
                products: [
                    {
                        productId: product._id.toString(),
                        name: product.name,
                        price: product.price,
                        quantity: 1
                    }
                ]
            }
        };

        let capturedResponse = null;
        const res = {
            status: (code) => ({
                json: (data) => {
                    console.log(`Response [${code}]:`, JSON.stringify(data, null, 2));
                    if (code >= 400) throw new Error(data.error || 'Request failed');
                    capturedResponse = data;
                    return data;
                }
            }),
            json: (data) => {
                console.log('Response [200]:', JSON.stringify(data, null, 2));
                capturedResponse = data;
                return data;
            }
        };

        console.log('--- Executing finishAppointment ---');
        await adminController.finishAppointment(req, res);

        // 3. Verify Product Stock
        const updatedProduct = await Product.findById(product._id);
        console.log('Updated Stock:', updatedProduct.stock);
        if (updatedProduct.stock !== 9) {
            console.error('FAIL: Stock was not deducted correctly. Expected 9, got', updatedProduct.stock);
        } else {
            console.log('PASS: Stock deducted correctly.');
        }

        // 4. Verify Appointment Data
        const updatedAppointment = await Appointment.findById(appointment._id);
        console.log('Updated Appointment Products:', updatedAppointment.products);
        if (updatedAppointment.products.length !== 1) {
            console.error('FAIL: Product not added to appointment.');
        } else {
            console.log('PASS: Product added to appointment.');
        }
        
        if (updatedAppointment.finalPrice !== 150) {
             console.error('FAIL: Final price not updated correctly. Expected 150, got', updatedAppointment.finalPrice);
        } else {
            console.log('PASS: Final price correct.');
        }

        // 5. Verify Report
        // Mock request for report
        const reportReq = {
            user: { salonId: salonId.toString() },
            query: {
                start: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
                end: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString()
            }
        };

        console.log('--- Executing getReports ---');
        capturedResponse = null;
        await adminController.getReports(reportReq, res);

        const report = capturedResponse;
        
        // Assertions for Report
        if (!report.byProduct || report.byProduct.length === 0) {
             console.error('FAIL: Report missing byProduct data.');
        } else {
            const prodStats = report.byProduct[0];
            if (prodStats.name === 'Shampoo Premium' && prodStats.value === 50 && prodStats.count === 1) {
                console.log('PASS: Report byProduct is correct.');
            } else {
                console.error('FAIL: Report byProduct data mismatch:', prodStats);
            }
        }

        if (report.summary && report.summary.totalRevenue === 150) {
             console.log('PASS: Report totalRevenue is correct.');
        } else {
             console.error('FAIL: Report totalRevenue mismatch. Expected 150, got', report.summary?.totalRevenue);
        }

    } catch (err) {
        console.error('Test Failed:', err);
    } finally {
        if (mongoServer) await mongoServer.stop();
        await mongoose.disconnect();
    }
}

testFullFlow();
