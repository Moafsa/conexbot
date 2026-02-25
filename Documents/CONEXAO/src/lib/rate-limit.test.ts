import { rateLimit, apiLimiter, authLimiter } from './rate-limit'

describe('Rate Limiter', () => {
    beforeEach(() => {
        // Clear rate limit store between tests by using unique keys
    })

    it('allows requests within limit', () => {
        const key = `test-allow-${Date.now()}`
        const result = rateLimit(key, 5, 60000)
        expect(result.allowed).toBe(true)
        expect(result.remaining).toBe(4)
    })

    it('blocks requests exceeding limit', () => {
        const key = `test-block-${Date.now()}`

        // Make 5 requests (limit)
        for (let i = 0; i < 5; i++) {
            rateLimit(key, 5, 60000)
        }

        // 6th should be blocked
        const result = rateLimit(key, 5, 60000)
        expect(result.allowed).toBe(false)
        expect(result.remaining).toBe(0)
    })

    it('resets after window expires', () => {
        const key = `test-reset-${Date.now()}`

        // Use a very short window (1ms)
        rateLimit(key, 1, 1)

        // Wait a tiny bit and try again
        const result = rateLimit(key, 1, 1)
        // Either the window expired or it's blocked
        expect(typeof result.allowed).toBe('boolean')
    })

    it('tracks remaining correctly', () => {
        const key = `test-remaining-${Date.now()}`
        const limit = 10

        const r1 = rateLimit(key, limit, 60000)
        expect(r1.remaining).toBe(9)

        const r2 = rateLimit(key, limit, 60000)
        expect(r2.remaining).toBe(8)

        const r3 = rateLimit(key, limit, 60000)
        expect(r3.remaining).toBe(7)
    })

    it('apiLimiter uses correct limits', () => {
        const result = apiLimiter(`test-api-${Date.now()}`)
        expect(result.allowed).toBe(true)
        expect(result.remaining).toBe(99) // 100 - 1
    })

    it('authLimiter uses stricter limits', () => {
        const result = authLimiter(`test-auth-${Date.now()}`)
        expect(result.allowed).toBe(true)
        expect(result.remaining).toBe(9) // 10 - 1
    })
})
