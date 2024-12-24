import { env } from 'bun';
import fs from 'fs/promises';

let test_url = env.DOMAIN;

if (env.SUBDOMAIN) {
    test_url = `${env.SUBDOMAIN}.${test_url}`;
}
if (env.PORT) {
    test_url = `${test_url}:${env.PORT}`;
}

test_url = `https://${test_url}/apple`;

let ssl_active = false;

await fetch(test_url).then((req) => {
    if (req.status === 200) {
        ssl_active = true;
    }
}).catch(() => {});

if (!ssl_active) {
    const certs = await (await fetch(`https://api.porkbun.com/api/json/v3/ssl/retrieve/${env.DOMAIN}`, {
        method: 'POST',
        body: JSON.stringify({
            apikey: env.API_INSTANCE,
            secretapikey: env.API_SECRET
        })
    })).json() as {
        status: 'SUCCESS' | 'ERROR',
        certificatechain: string,
        privatekey: string,
        publickey: string
    };

    if (certs?.status === 'SUCCESS') {
        await fs.writeFile('/home/headscale/tls/domain.cert.pem', certs.certificatechain);

        await fs.writeFile('/home/headscale/tls/private.key.pem', certs.privatekey);
    }
}