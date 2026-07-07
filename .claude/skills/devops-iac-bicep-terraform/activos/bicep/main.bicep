// main.bicep — línea base IaC en Bicep (Azure) para app .NET 8 + Azure SQL (línea gobierno).
// N0: plantilla desde buenas prácticas; VERIFICAR las apiVersion y el SKU antes de desplegar.
// SIN SECRETOS: la contraseña de SQL se referencia desde Key Vault en el archivo de parámetros.
// Despliegue:  az deployment group create -g <rg> -f main.bicep -p main.parameters.dev.json
// Dry-run:     az deployment group what-if -g <rg> -f main.bicep -p main.parameters.dev.json

targetScope = 'resourceGroup'

@description('Entorno de despliegue')
@allowed([ 'dev', 'staging', 'prod' ])
param entorno string

@description('Prefijo kebab-case del proyecto, p.ej. pnmc')
param proyecto string

@description('Región Azure (ajustar a la nube de la entidad)')
param ubicacion string = resourceGroup().location

@description('Contraseña admin de SQL — se inyecta desde Key Vault vía el archivo de parámetros, NUNCA aquí')
@secure()
param sqlAdminPassword string

var sufijo = '${proyecto}-${entorno}'
var etiquetas = {
  proyecto: proyecto
  entorno: entorno
  gestionadoPor: 'IaC-Bicep'
  normativa: 'DI-GSI-010'
}

resource plan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: 'plan-${sufijo}'
  location: ubicacion
  sku: { name: (entorno == 'prod') ? 'P1v3' : 'B1' }
  tags: etiquetas
}

resource app 'Microsoft.Web/sites@2023-12-01' = {
  name: 'app-${sufijo}'
  location: ubicacion
  identity: { type: 'SystemAssigned' } // identidad administrada: leer Key Vault sin cadenas con secreto
  properties: {
    serverFarmId: plan.id
    httpsOnly: true
    siteConfig: {
      netFrameworkVersion: 'v8.0'
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
    }
  }
  tags: etiquetas
}

resource sqlServer 'Microsoft.Sql/servers@2023-08-01-preview' = {
  name: 'sql-${sufijo}'
  location: ubicacion
  properties: {
    administratorLogin: 'sqladmin'
    administratorLoginPassword: sqlAdminPassword // valor real inyectado desde Key Vault (ver parámetros)
    minimalTlsVersion: '1.2'
    publicNetworkAccess: 'Disabled' // acceso solo por red privada (endurecimiento gob DI-GSI-010)
  }
  tags: etiquetas
}

resource db 'Microsoft.Sql/servers/databases@2023-08-01-preview' = {
  parent: sqlServer
  name: 'db-${sufijo}'
  location: ubicacion
  sku: { name: (entorno == 'prod') ? 'S1' : 'Basic' }
  tags: etiquetas
}

output appNombre string = app.name
output appHost string = app.properties.defaultHostName
output sqlFqdn string = sqlServer.properties.fullyQualifiedDomainName
