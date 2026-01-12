const common = require("./media.ui.common");
const upload = require("./media.ui.tab.upload");
const convert = require("./media.ui.tab.convert");
const files = require("./media.ui.tab.files");

module.exports = [...common, ...upload, ...convert, ...files];
