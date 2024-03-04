# End-to-End examples in TypeScript build with Restate


### Food Ordering App

The [Food Order App](food-ordering) implements a food delivery service (like DoorDash) that
manages orders, restaurants, payments, and delivery drivers.

The example mixes workflows (ordering) and stateful microservices (driver management),
and uses Kafka as an event source for updates from delivery drivers.


### AI Image Workflows

The [AI Image Workflow](ai-image-workflows) example runs image processing workflows through services like stable diffusion
and through image processing libraries. It takes a definition of workflow steps and interprets those,
relaying the calls to services implementing the steps.

The example shows how to build a dynamic workflow interpreter and use workflows to drive work in
other services.


### e-commerce shop

The [online shop example](ecommerce-store) implements a simple shopping website with cart, products, and checkpoint process. 

The example uses Restate for state management (cart), shows integration with databases (products) and uses
durable execution for the checkout process,

| TypeScript  | [Ticket reservation](ticket-reservation): Example showing Restate's keyed-sharding and concurrency guarantees |
