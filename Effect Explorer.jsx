// Effect Explorer.jsx v0.9.0
// Phillip Jordan 2024
// Comissioned by Ingenuity Studios GFX Department
// Based on original "AE_Effects_Checker.jsx" script by Rene Fabian Burgos at Ingenuity Studios

// This script catalogs effects used in the active project, and the composition(s) and layer(s) they are applied to.

// Additions/Features (v0.9.0):
// - convenient panel instead of individual alerts.
// - displays the effects used in the project, grouped in a collabsible tree structure.
// - option to use Effects or Comps as the top-level grouping
// - option to search through all comps or only those selected in the *Project* panel. 
// - shows unique and total effect instances per comp, effect, and layer
// - summary at bottom of panel (unfinished)
//
// - Available settings:
//     - show/hide disabled layers & effect instances (unfinished)
//     - use effect's displayName or matchName
//          - *when an effect uses multiple display names across the project (like if it was renamed), the matchName is always used*

// - TODO fix/features:
//     - Finish "Group by Comp"
//     - Finish Summary at bottom of panel, create summaryData object
//     - Finish "item details" dialog
//     - Edge case dialogs (no comps selected, no effects in project/selected comps, etc.)
//     - spacing fixes
//     - progress bar / noInterrupt on refresh
//     - Sorting options
//     - Consideration/warning of any nested comps' effects when applicable to prevent whoopsies on render
//     - Filtering options like
//          - first/third party effects
//          - Effect visibility toggle list populated from the effects found in project or selection
//          - A similar manufacturer toggle list
//          - A similar category toggle list
//     - Option to hide Counts in tree labels
//     - Ability to "expand all" or "collapse all" in tree
//     - Effect/Comp/Layer details dialog when double-clicking an item in the effectsTree
//     - Exporting effect reports to txt, csv, pdf, or json
//          - Project-wide reports with full detail & totals
//          - Reports optionally respect current view-filters
//          - Reports of individual comps, effects, or layers
//               - *note: see if ScriptUI treeview supports multi-selection*
//          - *.json effect reporting could also be used for automatic replacement or warnings in future scripts dealing with farm render nodes. Would need effect index per layer and param storage to replace properly, though.*
//     - HTML/CEP refactor would allow for better filtering/search, ui snappiness, navigation, etc.

function effectsChecker(thisObj) {
        // declare anything used in multiple functions like data/controls/settings
        var win, effectsTree, refreshButton, settingsButton, serarchStatusText, summaryText;
        var searchAllComps, searchSelectedComps, groupByEffect, groupByComp;
        var settingsPanel, useDisplayNameRadio, useMatchNameRadio, showDisabledCheckbox;
        var queryData = {
            effects: {},
            comps: {},
            layers: {},
            instances: [],
            nestedComps: {}
        };
        var summaryData = {
            effectTotal: 0,
            compTotal: 0,
            effectInstanceTotal: 0
        };
        var settings = {
            useDisplayName: true,
            showDisabled: false
        };
        var scriptInfo = {
            version: "0.9.0a",
            author: "Phillip Jordan",
            description: "Catalogs effects used in your project, and indicates the composition(s) and layer(s) they are applied to.",
        };

    // main UI / init function
    function buildUI() {
        win = (thisObj instanceof Panel) ? thisObj : new Window("palette", "Effect Explorer", undefined, {resizeable: true});
        win.orientation = "column";
        win.alignChildren = ["fill", "top"];
        win.spacing = 10;
        win.margins = 16;
        win.preferredSize = [400, 600];

        var mainPanel = win.add("group");
        mainPanel.orientation = "stack";
        mainPanel.alignment = ["fill", "fill"];
        mainPanel.alignChildren = ["fill", "fill"];

        var catalogPanel = mainPanel.add("group");
        catalogPanel.orientation = "column";
        catalogPanel.alignment = ["fill", "fill"];
        catalogPanel.alignChildren = ["fill", "top"];

        var optionsGroup = catalogPanel.add("panel", undefined, "Effect Tree Options");
        var searchGroup = optionsGroup.add("group");
        searchGroup.orientation = "row";
        searchGroup.alignment = ["fill", "top"];
        searchGroup.add("statictext", undefined, "Search in:");
        searchGroup.helpTip = "Search entire project or only the comps selected in the *Project* panel";
        searchAllComps = searchGroup.add("radiobutton", undefined, "All Comps");
        searchSelectedComps = searchGroup.add("radiobutton", undefined, "Selected Comps");
        searchAllComps.value = true;

        var groupByGroup = optionsGroup.add("group");
        groupByGroup.orientation = "row";
        groupByGroup.alignment = ["fill", "top"];
        groupByGroup.add("statictext", undefined, "Group by:");
        groupByEffect = groupByGroup.add("radiobutton", undefined, "Effect");
        groupByComp = groupByGroup.add("radiobutton", undefined, "Comp");
        groupByEffect.value = true;
        
        var buttonGroup = catalogPanel.add("group");
        buttonGroup.orientation = "row";
        buttonGroup.alignment = ["fill", "top"];
        refreshButton = buttonGroup.add("button", undefined, "Refresh");
        refreshButton.alignment = ["fill", "top"];
        settingsButton = buttonGroup.add("button", undefined, "Settings");

        searchStatusText = catalogPanel.add("statictext", undefined, "");

        effectsTree = catalogPanel.add("treeview", undefined, []);
        effectsTree.alignment = ["fill", "fill"];

        var summaryGroup = catalogPanel.add("group");
        summaryGroup.orientation = "column";
        summaryGroup.alignment = ["fill", "bottom"];
        summaryGroup.alignChildren = ["fill", "center"];
        summaryText = summaryGroup.add("statictext", undefined, Object.keys(queryData.effects).length + " effects across " + Object.keys(queryData.comps).length + " comp(s)" +  "\r3737 total effect instances", {multiline: true});

        settingsPanel = mainPanel.add("group");
        settingsPanel.orientation = "column";
        settingsPanel.alignment = ["fill", "fill"];
        settingsPanel.alignChildren = ["fill", "top"];
        settingsPanel.visible = false;

        var nameGroup = settingsPanel.add("panel", undefined, "For Effects, Use:");
        nameGroup.orientation = "row";
        nameGroup.alignment = ["fill", "top"];
        useDisplayNameRadio = nameGroup.add("radiobutton", undefined, "Display Name");
        useMatchNameRadio = nameGroup.add("radiobutton", undefined, "Match Name");
        useDisplayNameRadio.value = settings.useDisplayName;
        useMatchNameRadio.value = !settings.useDisplayName;

        showDisabledCheckbox = settingsPanel.add("checkbox", undefined, "Show Disabled Layers/Effect instances");
        showDisabledCheckbox.value = settings.showDisabled;

        var closeSettingsButton = settingsPanel.add("button", undefined, "Back to Effect List");
        closeSettingsButton.alignment = ["fill", "top"];

        var infoGroup = settingsPanel.add("panel", undefined, "Info");
        infoGroup.orientation = "column";
        infoGroup.alignment = ["fill", "top"];
        infoGroup.alignChildren = ["left", "top"];
        infoGroup.add("statictext", undefined, "AE Effect Explorer - v" + scriptInfo.version);
        infoGroup.add("statictext", undefined, "Created by " + scriptInfo.author);
        infoGroup.add("statictext", undefined, scriptInfo.description, {multiline: true});
    

        refreshButton.onClick = collectAndDisplayEffects;
        settingsButton.onClick = function() {
            catalogPanel.visible = false;
            settingsPanel.visible = true;
        };
        closeSettingsButton.onClick = function() {
            settings.useDisplayName = useDisplayNameRadio.value;
            settings.showDisabled = showDisabledCheckbox.value;
            settingsPanel.visible = false;
            catalogPanel.visible = true;
            updateDisplay();
        };
        win.onResizing = win.onResize = function() {
            this.layout.resize();
        };

        if (win instanceof Window) {
            win.center();
            win.show();
        } else {
            win.layout.layout(true);
        }
    }

    function ProgressBar(title) {
        var progWin = new Window("palette", title, undefined, {closeButton: true});
        var progressBar = progWin.add("progressbar", undefined, 0, 100);
        progressBar.preferredSize.width = 300;
        var statusText = progWin.add("statictext", undefined, "");
        statusText.preferredSize.width = 300;

        this.setTotal = function(total) {
            progressBar.maxvalue = total;
        };

        this.update = function(value) {
            progressBar.value = value;
            statusText.text = "Processing: " + value + " / " + progressBar.maxvalue;
            progWin.update();
        };

        this.show = function() {
            progWin.show();
        };

        this.close = function() {
            progWin.close();
        };
    }

    function updateDisplay() {
        effectsTree.removeAll();
        if (groupByEffect.value) {
            displayEffectsByEffect();
        } else {
            displayEffectsByComp();
        }
    }

    function updateSearchStatus() {
        var statusText = "";
        var totalComps = getAllComps().length;
        var searchedComps = searchAllComps.value ? totalComps : getSelectedComps().length;

        if (searchAllComps.value) {
            statusText = "Exploring Entire Project";
        } else if (searchedComps === 1) {
            statusText = "Exploring: Composition \"" + getSelectedComps()[0].name + "\"";
        } else {
            statusText = "Exploring " + searchedComps + " Selected Compositions";
        }
        searchStatusText.text = statusText;
    }

    function updateSummary() {
        var effectCount = Object.keys(queryData.effects).length;
        var compCount = Object.keys(queryData.comps).length;
        var instanceCount = summaryData.effectInstanceTotal;
        var summaryString = effectCount + (effectCount === 1 ? " effect" : " effects") + " across " +
                        compCount + (compCount === 1 ? " comp" : " comps") + "\r" +
                        instanceCount + " total effect instance" + (instanceCount === 1 ? "" : "s");

        summaryText.text = summaryString;
    }

    function getAllComps() {
        var allComps = [];
        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);
            if (item instanceof CompItem) {
                allComps.push(item);
            }
        }
        return allComps;
    }

    function getSelectedComps() {
        var selectedComps = [];
        for (var i = 0; i < app.project.selection.length; i++) {
            var item = app.project.selection[i];
            if (item instanceof CompItem) {
                selectedComps.push(item);
            }
        }
        return selectedComps;
    }

    function collectAndDisplayEffects() {
        queryData = {
                effects: {},
                comps: {},
                layers: {},
                instances: [],
                nestedComps: {}
            };

        summaryData = {
                effectTotal: 0,
                compTotal: 0,
                effectInstanceTotal: 0
            };

        progressBar = new ProgressBar("Indexing Effects");
        progressBar.show();
        
        app.beginUndoGroup("Collect Effects");


        try {
            var compsToProcess = searchAllComps.value ? getAllComps() : getSelectedComps();
            progressBar.setTotal(compsToProcess.length);
            
            for (var i = 0; i < compsToProcess.length; i++) {
                processComposition(compsToProcess[i]);
                progressBar.update(i+1);
            }   
        } finally {
    
            app.endUndoGroup();
            progressBar.close();
        }    

        updateSearchStatus();
        displayEffects();
        updateSummary();
    }

    function processComposition(comp, parentCompName) {
        parentCompName = parentCompName || null; // This is how you do default params in extendscript
        if (!queryData.comps[comp.name]) {
            queryData.comps[comp.name] = {
                effectCount: 0,
                enabledEffectCount: 0,
                nestedInComps: [],
                conaintsNestedComps: false
            };
            summaryData.compTotal++;
        }

        for (var i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);
            processLayer(layer, comp.name);
        }
    }

    function processLayer(layer, compName) {
        var layerId = compName + "_" + layer.index;
        if (!queryData.layers[layerId]) {
            queryData.layers[layerId] = {
                name: layer.name,
                index: layer.index,
                effectCount: 0,
                enabledEffectCount: 0
            };
        }
        var effects = layer.property("ADBE Effect Parade");
        if (effects) {
            for (var j = 1; j <= effects.numProperties; j++) {
                var effect = effects.property(j);
                addEffectData(effect, compName, layerId, layer.enabled && effect.enabled, j);
            }
        }
    }

    // Populate queryData with effect data while considering relations and updating counts
function addEffectData(effect, compName, layerId, isEnabled, effectIndex) {
    var matchName = effect.matchName;
    var displayName = effect.name;

    // Update effects data
    if (!queryData.effects[matchName]) {
        queryData.effects[matchName] = {
            displayName: displayName,
            instanceCount: 0,
            enabledInstanceCount: 0,
            comps: {}
        };
        summaryData.effectTotal++;
    }
    queryData.effects[matchName].instanceCount++;
    if (isEnabled) {
        queryData.effects[matchName].enabledInstanceCount++;
    }
    
    // Update effect's comp data
    if (!queryData.effects[matchName].comps[compName]) {
        queryData.effects[matchName].comps[compName] = {
            instanceCount: 0,
            enabledInstanceCount: 0
        };
    }
    queryData.effects[matchName].comps[compName].instanceCount++;
    if (isEnabled) {
        queryData.effects[matchName].comps[compName].enabledInstanceCount++;
    }

    // Update comp data
    if (!queryData.comps[compName]) {
        queryData.comps[compName] = {
            effectCount: 0,
            enabledEffectCount: 0,
            nestedInComps: [],
            containsNestedComps: false
        };
    }
    queryData.comps[compName].effectCount++;
    if (isEnabled) {
        queryData.comps[compName].enabledEffectCount++;
    }

    // Update layer data
    if (!queryData.layers[layerId]) {
        queryData.layers[layerId] = {
            name: layerId.split('_')[1],  // Assuming layerId is in the format "compName_layerName"
            index: parseInt(layerId.split('_')[1]),
            effectCount: 0,
            enabledEffectCount: 0
        };
    }
    queryData.layers[layerId].effectCount++;
    if (isEnabled) {
        queryData.layers[layerId].enabledEffectCount++;
    }

    // Add instance
    queryData.instances.push({
        effectMatchName: matchName,
        compName: compName,
        layerId: layerId,
        effectIndex: effectIndex,
        isEnabled: isEnabled
    });

    summaryData.effectInstanceTotal++;
}

    /*
    // Item info dialog that doesn't work yet

    function showEffectInfo(matchName) {
        var effect = queryData.effects[matchName];
        var infoWindow = new Window("dialog", "Effect Info");
        infoWindow.orientation = "column";
        infoWindow.alignChildren = ["left", "top"];
        infoWindow.add("statictext", undefined, "Effect: " + effect.displayName);
        infoWindow.add("statictext", undefined, "Match Name: " + matchName);
        infoWindow.add("statictext", undefined, "Total Instances: " + effect.totalInstances);
        infoWindow.add("statictext", undefined, "Used in " + Object.keys(effect.comps).length + " compositions"); 

        var closeButton = infoWindow.add("button", undefined, "Close");
        closeButton.onClick = function() { infoWindow.close(); };
        infoWindow.show();
    } */
    
    // called by refresh button, calls correct tree rebuild function based on specified grouping

    function displayEffects() {
        effectsTree.removeAll();

        if (groupByEffect.value) {
            displayEffectsByEffect();
        } else {
            displayEffectsByComp();
        }
    }

    // helper function to hide redundant counts
    function formatNodeLabel(name, uniqueCount, totalCount) {
        if (uniqueCount === totalCount) {
            return name + " (" + uniqueCount + ")";
        } else {
            return name + " (" + uniqueCount + ") [" + totalCount + "]";
        }
    }

    // Build the filtered effects tree using effect.matchName as the top-level grouping
    function displayEffectsByEffect() {
        effectsTree.removeAll();

        var effectsList = Object.keys(queryData.effects).map(function(matchName) {
            return { matchName: matchName, effect: queryData.effects[matchName] };
        });

        effectsList.sort(function(a, b) {
            return b.effect.instanceCount - a.effect.instanceCount;
        });

        effectsList.forEach(function(effectData) {
            try {
                var matchName = effectData.matchName;
                var effect = effectData.effect;
                if (!effect) {
                    $.writeln("Error: effect is undefined for matchName: " + matchName);
                    return;
                }
                var nodeName = settings.useDisplayName ? effect.displayName : matchName;
                var totalInstances = settings.showDisabled ? effect.instanceCount : effect.enabledInstanceCount;
                
                if (!effect.comps) {
                    $.writeln("Error: effect.comps is undefined for effect: " + nodeName);
                    effect.comps = {};
                }
                
                var effectNode = effectsTree.add("node", formatNodeLabel(nodeName, Object.keys(effect.comps).length, totalInstances));
                effectNode.matchName = matchName;

                Object.keys(effect.comps).forEach(function(compName) {
                    var compData = effect.comps[compName];
                    if (!compData) {
                        $.writeln("Error: compData is undefined for compName: " + compName);
                        return;
                    }
                    var compInstances = settings.showDisabled ? compData.instanceCount : compData.enabledInstanceCount;
                    var compNode = effectNode.add("node", formatNodeLabel(compName, compInstances));

                    var compInstances = queryData.instances.filter(function(instance) {
                        return instance.effectMatchName === matchName && 
                            instance.compName === compName && 
                            (settings.showDisabled || instance.isEnabled);
                    });

                    var layerGroups = groupBy(compInstances, 'layerId');
                    Object.keys(layerGroups).forEach(function(layerId) {
                        var layerInstances = layerGroups[layerId];
                        var layer = queryData.layers[layerId];
                        if (!layer) {
                            $.writeln("Error: layer is undefined for layerId: " + layerId);
                            return;
                        }
                        var layerNode = compNode.add("node", formatNodeLabel(layer.name, layerInstances.length));

                        layerInstances.forEach(function(instance) {
                            var instanceItem = layerNode.add("item", instance.effectIndex + ": " + effect.displayName);
                            if (!instance.isEnabled) {
                                instanceItem.enabled = false;
                            }
                        });
                    });

                    // Add nested comp indicator
                    if (queryData.comps[compName] && queryData.comps[compName].nestedInComps.length > 0) {
                        compNode.add("item", "* Nested in: " + queryData.comps[compName].nestedInComps.join(", "));
                    }
                });
            } catch (e) {
                $.writeln("Error in displayEffectsByEffect for effect: " + effectData.matchName + ". Error: " + e.toString());
            }
        });
    }

    function groupBy(array, key) {
        return array.reduce(function(result, currentValue) {
            (result[currentValue[key]] = result[currentValue[key]] || []).push(currentValue);
            return result;
        }, {});
    }

    // Build the filtered effects tree using comp.name as the top-level grouping
    function displayEffectsByComp() {
        effectsTree.removeAll();

        Object.keys(queryData.comps).forEach(function(compName) {
            var comp = queryData.comps[compName];
            var compNode = effectsTree.add("node", formatNodeLabel(compName, comp.effectCount, comp.enabledEffectCount));

            var compInstances = queryData.instances.filter(function(instance) {
                return instance.compName === compName && (settings.showDisabled || instance.isEnabled);
            });

            var effectGroups = groupBy(compInstances, 'effectMatchName');
            Object.keys(effectGroups).forEach(function(matchName) {
                var effectInstances = effectGroups[matchName];
                var effect = queryData.effects[matchName];
                var effectNode = compNode.add("node", formatNodeLabel(effect.displayName, effectInstances.length));

                var layerGroups = groupBy(effectInstances, 'layerId');
                Object.keys(layerGroups).forEach(function(layerId) {
                    var layerInstances = layerGroups[layerId];
                    var layer = queryData.layers[layerId];
                    var layerNode = effectNode.add("node", formatNodeLabel(layer.name, layerInstances.length));

                    layerInstances.forEach(function(instance) {
                        var instanceItem = layerNode.add("item", instance.effectIndex + ": " + effect.displayName);
                        if (!instance.isEnabled) {
                            instanceItem.enabled = false;
                        }
                    });
                });
            });
        });
    }



    buildUI();
    collectAndDisplayEffects();
}

effectsChecker(this);