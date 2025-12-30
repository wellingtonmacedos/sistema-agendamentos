const axios = require('axios');

const baseURL = 'http://localhost:3000/api';

const testCreateAppt = async () => {
    try {
        console.log('1. Getting Salons...');
        const salonsRes = await axios.get(`${baseURL}/salons`);
        if (salonsRes.data.length === 0) {
            console.error('No salons found.');
            return;
        }
        const salon = salonsRes.data[0];
        console.log(`Salon found: ${salon.name} (${salon._id})`);

        console.log('2. Getting Services...');
        const servicesRes = await axios.get(`${baseURL}/services?salao_id=${salon._id}`);
        if (servicesRes.data.length === 0) {
            console.error('No services found.');
            return;
        }
        const service = servicesRes.data[0];
        console.log(`Service found: ${service.name} (${service._id})`);

        console.log('3. Getting Professionals...');
        const prosRes = await axios.get(`${baseURL}/professionals?salao_id=${salon._id}`);
        if (prosRes.data.length === 0) {
            console.error('No professionals found.');
            return;
        }
        const pro = prosRes.data[0];
        console.log(`Professional found: ${pro.name} (${pro._id})`);

        console.log('4. Creating Appointment...');
        const appointmentData = {
            salao_id: salon._id,
            profissional_id: pro._id,
            data: '2025-12-30',
            hora_inicio: '11:30',
            servicos: [service._id],
            cliente: 'Test User',
            telefone: '11999999999',
            origin: 'client'
        };

        try {
            const createRes = await axios.post(`${baseURL}/agendamentos`, appointmentData);
            console.log('Appointment Created:', createRes.data);
        } catch (e) {
            if (e.response && e.response.status === 409) {
                console.log('Slot unavailable, trying another time...');
                // Try 12:30
                appointmentData.hora_inicio = '12:30';
                const createRes2 = await axios.post(`${baseURL}/agendamentos`, appointmentData);
                console.log('Appointment Created (Retry):', createRes2.data);
            } else {
                throw e;
            }
        }

        console.log('5. Verifying via My Appointments...');
        const myApptsRes = await axios.get(`${baseURL}/my-appointments?phone=11999999999`);
        const myAppt = myApptsRes.data.find(a => a.customerPhone.includes('99999999'));
        
        if (myAppt) {
            console.log('Appointment Found!');
            console.log('ID:', myAppt._id);
            console.log('StartTime (UTC):', myAppt.startTime);
            console.log('Hora Inicio (String):', myAppt.hora_inicio); // This is what we want to verify!
            
            if (myAppt.hora_inicio === appointmentData.hora_inicio) {
                console.log('SUCCESS: hora_inicio is correctly saved as string.');
            } else {
                console.error('FAILURE: hora_inicio mismatch or missing.');
            }
        } else {
            console.error('Appointment not found in list.');
        }

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
};

testCreateAppt();
