/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@flashpark/ui', '@flashpark/db', '@flashpark/api', '@flashpark/utils'],
}

module.exports = nextConfig
