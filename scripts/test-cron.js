#!/usr/bin/env node

/**
 * Script para probar el cron job de actualización de medidores
 * 
 * Uso:
 * node scripts/test-cron.js [URL]
 * 
 * Ejemplos:
 * node scripts/test-cron.js                    # Local
 * node scripts/test-cron.js https://tu-app.vercel.app  # Producción
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.argv[2] || 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET || 'test-secret';

async function testCronJob() {
    console.log('🧪 Probando Cron Job de Actualización de Medidores');
    console.log('='.repeat(60));

    const url = `${BASE_URL}/api/cron/update-meter-status`;

    console.log(`📍 URL: ${url}`);
    console.log(`🔑 Secret: ${CRON_SECRET ? '✅ Configurado' : '❌ No configurado'}`);
    console.log('');

    try {
        // Test 1: GET - Verificar estado actual
        console.log('📊 Test 1: Verificando estado actual...');
        const getResponse = await makeRequest('GET', url);

        if (getResponse.success) {
            console.log('✅ GET exitoso');
            console.log(`   📈 Total medidores: ${getResponse.stats.totalMeters}`);
            console.log(`   🟢 Activos: ${getResponse.stats.activeMeters}`);
            console.log(`   🔴 Inactivos: ${getResponse.stats.inactiveMeters}`);
            console.log(`   ⚠️  Inconsistencias: ${getResponse.stats.inconsistencies.totalInconsistencies}`);
        } else {
            console.log('❌ GET falló:', getResponse.error);
        }

        console.log('');

        // Test 2: POST - Ejecutar actualización
        console.log('🔄 Test 2: Ejecutando actualización...');
        const postResponse = await makeRequest('POST', url, {
            'Authorization': `Bearer ${CRON_SECRET}`
        });

        if (postResponse.success) {
            console.log('✅ POST exitoso');
            console.log(`   📊 Resumen:`);
            console.log(`      - Total medidores: ${postResponse.summary.totalMeters}`);
            console.log(`      - Activos: ${postResponse.summary.activeMeters}`);
            console.log(`      - Inactivos: ${postResponse.summary.inactiveMeters}`);
            console.log(`      - Desactivados: ${postResponse.summary.deactivatedCount}`);
            console.log(`      - Reactivados: ${postResponse.summary.activatedCount}`);
            console.log(`      - Cambio neto: ${postResponse.summary.netChange}`);

            if (postResponse.details.metersToDeactivate.length > 0) {
                console.log(`   🔴 Medidores desactivados:`);
                postResponse.details.metersToDeactivate.forEach(m => {
                    console.log(`      - ${m.device_name} (${m.dev_eui})`);
                });
            }

            if (postResponse.details.metersToActivate.length > 0) {
                console.log(`   🟢 Medidores reactivados:`);
                postResponse.details.metersToActivate.forEach(m => {
                    console.log(`      - ${m.device_name} (${m.dev_eui})`);
                });
            }
        } else {
            console.log('❌ POST falló:', postResponse.error);
        }

        console.log('');
        console.log('🎉 Test completado');

    } catch (error) {
        console.error('💥 Error durante el test:', error.message);
        process.exit(1);
    }
}

function makeRequest(method, url, headers = {}) {
    return new Promise((resolve, reject) => {
        const isHttps = url.startsWith('https://');
        const client = isHttps ? https : http;

        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = client.request(url, options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve(parsed);
                } catch (error) {
                    reject(new Error(`Error parsing JSON: ${error.message}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.end();
    });
}

// Ejecutar test
testCronJob();
