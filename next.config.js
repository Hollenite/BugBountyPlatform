/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/board',
        destination: '/programs',
        permanent: false,
      },
      {
        source: '/verifier',
        destination: '/submissions',
        permanent: false,
      },
      {
        source: '/verifier/:submissionId',
        destination: '/submissions/:submissionId',
        permanent: false,
      },
      {
        source: '/lab',
        has: [
          {
            type: 'query',
            key: 'programId',
            value: '(?<programId>.*)',
          },
        ],
        destination: '/lab/:programId',
        permanent: false,
      },
      {
        source: '/lab',
        destination: '/lab/prog-refund-demo',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig
