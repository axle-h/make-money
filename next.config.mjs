/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    async redirects() {
        return [
            {
                source: '/',
                destination: '/dashboard',
                permanent: false,
            },
        ]
    },
    experimental: {
        optimizePackageImports: ["@chakra-ui/react"],
    },
};


export default nextConfig;
