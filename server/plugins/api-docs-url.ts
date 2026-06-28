export default defineNitroPlugin(() => {
    const port = process.env.PORT ?? '3000'
    const envHost = process.env.HOST
    const host = envHost && envHost !== '0.0.0.0' && envHost !== '::' ? envHost : '127.0.0.1'
    console.log(`[docs] Scalar API reference: http://${host}:${port}/api/docs`)
})
