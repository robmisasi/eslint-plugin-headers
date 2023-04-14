/**
 * @fileoverview Rules for detecting file headers in docblock pragmas.
 * @author Rob Misasi
 */
"use strict";

//------------------------------------------------------------------------------
// Plugin Definition
//------------------------------------------------------------------------------

module.exports.rules = {
  "header-presence": require("./rules/header-presence"),
};
