import axios from 'axios';

async function testRender() {
  try {
    const res = await axios.get('http://localhost:3002/api/proyectos/test/render');
    console.log('Status:', res.status);
    console.log('Data keys:', Object.keys(res.data));
  } catch (error: any) {
    console.log('Error status:', error.response?.status);
    console.log('Error data:', error.response?.data);
  }
}

testRender();
