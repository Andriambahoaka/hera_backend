const fs = require("fs");
const path = require("path");

function renderTemplate(templateName, variables, ext = "html") {
  const filePath = path.join(__dirname, `../templates/${templateName}.${ext}`);
  let template = fs.readFileSync(filePath, "utf8");

  // Replace placeholders like {{name}}, {{email}}, {{tempPassword}}
  for (const key in variables) {
    const regex = new RegExp(`{{${key}}}`, "g");
    template = template.replace(regex, variables[key]);
  }

  return template;
}

module.exports = { renderTemplate };

