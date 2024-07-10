// IE_AE_Effects_Checker.jsx v1.0
// original script by Rene Fabian Burgos
// fork by Phillip Jordan

// This script will catalogall the effects in your project, and the composition and layer they are applied to.

// Collect all effects and plugins in the project
var effectsDict = {};

// Helper function to add effects to the dictionary with composition and layer details
function addEffectToDict(effectName, compName, layerName) {
    if (!effectsDict.hasOwnProperty(effectName)) {
        effectsDict[effectName] = [];
    }
    effectsDict[effectName].push({
        composition: compName,
        layer: layerName
    });
}

// Function to process a layer and collect its effects
function processLayer(layer, compName) {
    var effects = layer.property("ADBE Effect Parade");
    if (effects) {
        for (var j = 1; j <= effects.numProperties; j++) {
            var effect = effects.property(j);
            addEffectToDict(effect.name, compName, layer.name);
        }
    }
}

// Function to process a composition and its layers
function processComposition(comp) {
    for (var i = 1; i <= comp.numLayers; i++) {
        var layer = comp.layer(i);
        processLayer(layer, comp.name);
    }
}

// Iterate through all compositions in the project
for (var i = 1; i <= app.project.numItems; i++) {
    var item = app.project.item(i);
    if (item instanceof CompItem) {
        processComposition(item);
    }
}

// Collect and format the effect details for alerts
var effectsList = [];
for (var effectName in effectsDict) {
    if (effectsDict.hasOwnProperty(effectName)) {
        var details = "";
        for (var k = 0; k < effectsDict[effectName].length; k++) {
            details += "Composition: " + effectsDict[effectName][k].composition + ", Layer: " + effectsDict[effectName][k].layer + "\n";
        }
        effectsList.push(effectName + ":\n" + details);
    }
}

// Alert each effect and its details one at a time
for (var i = 0; i < effectsList.length; i++) {
    alert("Effect " + (i + 1) + " of " + effectsList.length + ":\n\n" + effectsList[i]);
}

