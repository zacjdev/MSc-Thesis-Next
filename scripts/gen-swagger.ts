// scripts/gen-swagger.ts
// npx ts-node scripts/gen-swagger.ts
const swaggerJSDoc = require("swagger-jsdoc");
const { writeFileSync } = require("fs");

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "MyApp API",
      version: "1.0.0",
      description: "API documentation generated from Next.js API routes",
    },
  },
  apis: ["./app/api/**/*.ts","./app/api/**/*.tsx"], // 👈 your Next.js API folder
};

const swaggerSpec = swaggerJSDoc(options);
writeFileSync("public/openapi.json", JSON.stringify(swaggerSpec, null, 2));

console.log("Swagger spec generated at public/openapi.json");
