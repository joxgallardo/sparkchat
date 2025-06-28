import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Handle handlebars require.extensions issue
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    // Ignore specific modules that cause issues
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push('@opentelemetry/exporter-jaeger');
    }
    
    // Exclude problematic modules
    config.externals = config.externals || [];
    config.externals.push('handlebars');
    
    return config;
  },
  serverExternalPackages: ['@opentelemetry/sdk-node', 'genkit', '@genkit-ai/googleai'],
  // Disable telemetry during build
  env: {
    OTEL_EXPORTER_JAEGER_ENDPOINT: '',
  },
};

export default nextConfig;
