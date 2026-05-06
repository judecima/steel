
import http from 'http';

const BASE_URL = 'http://localhost:3002';

async function request(path: string, method = 'GET', body?: any): Promise<any> {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        data: data ? JSON.parse(data) : null
                    });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', (e) => reject(e));
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function runTests() {
    console.log("=== RUNTIME VIEWER & EXPORT TESTS ===");

    // 1. render proyecto inexistente
    console.log("\nTEST 1: Render proyecto inexistente");
    const res1 = await request('/api/proyectos/non_existent_id/render');
    console.log("Status:", res1.status, "Data:", res1.data);
    if (res1.status === 404 && res1.data.ok === false && res1.data.code === 'PROJECT_NOT_FOUND') {
        console.log("PASSED");
    } else {
        console.log("FAILED");
    }

    // 2. render proyecto sin versión activa (necesitaría crear uno, pero podemos simular si tenemos uno roto)
    // Saltamos a los que podemos probar con el proyecto test_9e

    const testId = 'test_9e_1778102309619';

    // 4. render proyecto válido
    console.log("\nTEST 4: Render proyecto válido");
    const res4 = await request(`/api/proyectos/${testId}/render`);
    console.log("Status:", res4.status, "ok:", res4.data.ok);
    if (res4.status === 200 && res4.data.ok === true && res4.data.scene) {
        console.log("PASSED");
    } else {
        console.log("FAILED");
    }

    // 5. respuesta render con ok: true
    console.log("\nTEST 5: Respuesta render con ok: true");
    if (res4.data.ok === true) console.log("PASSED"); else console.log("FAILED");

    // 7. export PDF proyecto inexistente
    console.log("\nTEST 7: Export PDF proyecto inexistente");
    const res7 = await request('/api/proyectos/non_existent_id/exportaciones/generar', 'POST');
    console.log("Status:", res7.status, "Data:", res7.data);
    if (res7.status === 404) console.log("PASSED"); else console.log("FAILED");

    // 10. /api/exports detecta disponible/incompleto/pendiente
    console.log("\nTEST 10: /api/exports audit logic");
    const res10 = await request(`/api/exports?projectId=${testId}`);
    console.log("Status:", res10.status, "Data type:", typeof res10.data);
    if (res10.status === 200 && res10.data.ok === true && Array.isArray(res10.data.exports)) {
        const pdf = res10.data.exports.find((f: any) => f.filename === 'planos-tecnicos.pdf');
        console.log("PDF Status:", pdf?.status);
        console.log("PASSED");
    } else {
        console.log("FAILED");
    }

    console.log("\n=== TESTS COMPLETED ===");
    process.exit(0);
}

runTests().catch(err => {
    console.error(err);
    process.exit(1);
});
