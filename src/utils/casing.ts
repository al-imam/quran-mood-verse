export function toBaseCase(str = "") {
  return String(str)
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[-_]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/([0-9])([A-Z])/g, "$1 $2")
}

export function toPascalCase(str = "") {
  return toBaseCase(String(str))
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("")
}

export function toCamelCase(str = "") {
  const pascalCase = toPascalCase(String(str))
  return pascalCase.charAt(0).toLowerCase() + pascalCase.slice(1)
}

export function toSnakeCase(str = "") {
  return String(str)
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[-\s]+/g, "_")
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .toLowerCase()
}

export function toTitleCase(str = "") {
  return toBaseCase(String(str))
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
}

export function toCapitalizeCase(str = "") {
  const normalized = toBaseCase(String(str)).toLowerCase()
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

export function toKebabCase(str = "") {
  return String(str)
    .trim()
    .replace(/[\s_]+/g, "-")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
}
