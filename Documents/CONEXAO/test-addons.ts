import prisma from './src/lib/prisma';

async function test() {
    try {
        const product = await prisma.product.create({
            data: {
                botId: 'test-bot-123',
                name: 'Test Product',
                price: 10,
                type: 'SINGLE',
                addonGroups: {
                    create: [
                        {
                            botId: 'test-bot-123',
                            name: 'Test Group',
                            minSelect: 0,
                            maxSelect: 1,
                            active: true,
                            addons: {
                                create: [
                                    {
                                        name: 'Test Addon',
                                        price: 2,
                                        active: true
                                    }
                                ]
                            }
                        }
                    ]
                }
            }
        });
        
        console.log('Created product with addons!', product.id);
        
        const fetched = await prisma.product.findUnique({
            where: { id: product.id },
            include: {
                addonGroups: {
                    include: {
                        addons: true
                    }
                }
            }
        });
        
        console.log(JSON.stringify(fetched, null, 2));
    } catch (e) {
        console.error(e);
    }
}

test();
