/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    // OJO CON EL NOMBRE. En Next 15 esta opcion se llama
    // `serverExternalPackages` y va en la raiz; en 14.2, que es lo que corre
    // este proyecto, se llama asi y va dentro de `experimental`. Estaba puesta
    // con el nombre de 15, asi que Next la ignoraba sin fallar — solo un
    // warning de "clave desconocida" al arrancar.
    //
    // Consecuencia: con `output: "standalone"` Next copia unicamente las
    // dependencias que logra rastrear, y `mqtt` no estaba en ninguna lista ni
    // en el grafo de imports. No se copiaba al build, y el control de valvulas
    // moria en produccion con "Cannot find package 'mqtt'". En local nunca se
    // notaba porque ahi esta el node_modules entero.
    //
    // `mongodb` salio de la lista: la auditoria se movio a Postgres y ya no lo
    // importa nadie.
    serverComponentsExternalPackages: ["mqtt", "@google-cloud/vision"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ih1.redbubble.net",
      },
      {
        protocol: "https",
        hostname: "cloudflare-ipfs.com",
      },
      {
        protocol: "https",
        hostname: "utfs.io",
      },
    ],
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ["@svgr/webpack"], // ✅ add svgr
    });
    return config;
  },
};

export default nextConfig;
