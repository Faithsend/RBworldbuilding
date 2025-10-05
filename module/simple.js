/**
 * A simple and flexible system for world-building using an arbitrary collection of character and item attributes
 * Author: Atropos (V13-compatible patch)
 */

// Import Modules
import { SimpleActor } from "./actor.js";
import { SimpleItem } from "./item.js";
import { SimpleItemSheet } from "./item-sheet.js";
import { SimpleActorSheet } from "./actor-sheet.js";
import { preloadHandlebarsTemplates } from "./templates.js";
import { createWorldbuildingMacro } from "./macro.js";
import { SimpleToken, SimpleTokenDocument } from "./token.js";

Hooks.once("init", async function () {
  console.log("Initializing Simple Worldbuilding System");

  // Define initial Actor model (if needed by UI tools)
  game.system.model = game.system.model || {};
  game.system.model.Actor = {
    character: {
      attributes: {
        bar1: { type: "Resource", label: "Santé", value: 100, min: 0, max: 100 },
        bar2: { type: "Resource", label: "Mana", value: 50, min: 0, max: 50 }
      }
    }
  };

  // Initiative settings
  CONFIG.Combat.initiative = { formula: "1d20", decimals: 2 };

  // Expose helpers globally
  game.worldbuilding = {
    SimpleActor,
    createWorldbuildingMacro
  };

  // Register document classes
  CONFIG.Actor.documentClass = SimpleActor;
  CONFIG.Item.documentClass = SimpleItem;
  CONFIG.Token.documentClass = SimpleTokenDocument;
  CONFIG.Token.objectClass = SimpleToken;

  // Register custom sheets
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("worldbuilding", SimpleActorSheet, { makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("worldbuilding", SimpleItemSheet, { makeDefault: true });

  // Settings
  game.settings.register("worldbuilding", "macroShorthand", {
    name: "SETTINGS.SimpleMacroShorthandN",
    hint: "SETTINGS.SimpleMacroShorthandL",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register("worldbuilding", "initFormula", {
    name: "SETTINGS.SimpleInitFormulaN",
    hint: "SETTINGS.SimpleInitFormulaL",
    scope: "world",
    config: true,
    type: String,
    default: "1d20",
    onChange: formula => _simpleUpdateInit(formula, true)
  });

  // Init initiative from setting
  const initFormula = game.settings.get("worldbuilding", "initFormula");
  _simpleUpdateInit(initFormula);

  function _simpleUpdateInit(formula, notify = false) {
    const isValid = Roll.validate(formula);
    if (!isValid) {
      if (notify) ui.notifications.error(`${game.i18n.localize("SIMPLE.NotifyInitFormulaInvalid")}: ${formula}`);
      return;
    }
    CONFIG.Combat.initiative.formula = formula;
  }

  Handlebars.registerHelper("slugify", function (value) {
    return value?.slugify({ strict: true });
  });

  await preloadHandlebarsTemplates();
});

Hooks.on("hotbarDrop", (bar, data, slot) => createWorldbuildingMacro(data, slot));

Hooks.on("getActorDirectoryEntryContext", (html, options) => {
  options.push({
    name: game.i18n.localize("SIMPLE.DefineTemplate"),
    icon: '<i class="fas fa-stamp"></i>',
    condition: li => !game.actors.get(li.data("documentId")).getFlag("worldbuilding", "isTemplate"),
    callback: li => game.actors.get(li.data("documentId")).setFlag("worldbuilding", "isTemplate", true)
  });

  options.push({
    name: game.i18n.localize("SIMPLE.UnsetTemplate"),
    icon: '<i class="fas fa-times"></i>',
    condition: li => game.actors.get(li.data("documentId")).getFlag("worldbuilding", "isTemplate"),
    callback: li => game.actors.get(li.data("documentId")).setFlag("worldbuilding", "isTemplate", false)
  });
});

Hooks.on("getItemDirectoryEntryContext", (html, options) => {
  options.push({
    name: game.i18n.localize("SIMPLE.DefineTemplate"),
    icon: '<i class="fas fa-stamp"></i>',
    condition: li => !game.items.get(li.data("documentId")).getFlag("worldbuilding", "isTemplate"),
    callback: li => game.items.get(li.data("documentId")).setFlag("worldbuilding", "isTemplate", true)
  });

  options.push({
    name: game.i18n.localize("SIMPLE.UnsetTemplate"),
    icon: '<i class="fas fa-times"></i>',
    condition: li => game.items.get(li.data("documentId")).getFlag("worldbuilding", "isTemplate"),
    callback: li => game.items.get(li.data("documentId")).setFlag("worldbuilding", "isTemplate", false)
  });
});

