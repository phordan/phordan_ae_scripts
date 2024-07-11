// AE_EffectExplorer.jsx v1.0
// Phillip Jordan 2024
// Comissioned by Ingenuity Studios GFX Department
// Based on original "AE_Effects_Checker.jsx" script by Rene Fabian Burgos at Ingenuity Studios

// This script catalog effects used in the active project, and the composition(s) and layer(s) they are applied to.

// Additions/Features:
// - Convenient panel instead of individual alerts.
// - Displays the effects are grouped in a collabsible tree structure
//     - option to use Effects or Comps as the top-level grouping
//     - option to catalog all comps or only the comps selected in the *Project* panel. 
// - Summary at bottom of panel (unfinished)
//
// - Available settings:
//     - show/hide disabled layers & effect instances (unfinished)
//     - use effect's displayName or matchName
//          - when an effect uses multiple display names across the project (like if it was renamed), the matchName is always used.

// - TODO features:
//     - Finish "Group by Comp"
//     - Finish Summary at bottom of panel
//     - Sorting options
//     - Consideration/warning of nested comps' effects when applicable.
//     - Filtering options like
//          - first/third party effects
//          - Effect visibility list populated from the effects found in project/selection
//     - Option to hide Counts in tree labels
//     - Ability to "expand all" or "collapse all" in tree
//     - Effect/Comp/Layer details dialog when double-clicking an item in the effectsTree
//     - Exporting effect reports to txt, csv, or json
//          - Project-wide reports with full detail & totals
//          - Reports respecting current view-filters
//          - Reports of individual comps, effects, or layers
//               - *note: see if ScriptUI treeview supports multi-selection*
//          - json effect reporting could also be used for automatic replacement or warnings in future scripts dealing with farm render nodes. Would need effect index per layer though.
//     - HTML/CEP refactor allowing for better filtering, ui snappiness, navigation, etc.

function effectsChecker(thisObj) {
        // declare anything used in multiple functions like controls
        var win, effectsTree, refreshButton, settingsButton;
        var searchAllComps, searchSelectedComps, groupByEffect, groupByComp;
        var settingsPanel, useDisplayNameRadio, useMatchNameRadio, showDisabledCheckbox;
        var projectData = {
            effects: {},
            comps: {},
        };
        var settings = {
            useDisplayName: true,
            showDisabled: false
        };
        var scriptInfo = {
            version: "1.0.0",
            author: "Phillip Jordan",
            description: "Catalogs effects used in your project, and indicates the composition(s) and layer(s) they are applied to.",
        };

    function buildUI() {
        win = (thisObj instanceof Panel) ? thisObj : new Window("palette", "Effects Explorer", undefined, {resizeable: true});
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

        effectsTree = catalogPanel.add("treeview", undefined, []);
        effectsTree.alignment = ["fill", "fill"];

        var summaryGroup = catalogPanel.add("group");
        summaryGroup.orientation = "column";
        summaryGroup.alignment = ["fill", "bottom"];
        summaryGroup.alignChildren = ["fill", "center"];
        summaryGroup.add("statictext", undefined, Object.keys(projectData.effects).length + " effects across " + Object.keys(projectData.comps).length + " comp(s)" +  "\r3737 total effect instances", {multiline: true});

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

        showDisabledCheckbox = settingsPanel.add("checkbox", undefined, "Show Disabled Layers & Effect instances");
        showDisabledCheckbox.value = settings.showDisabled;

        var closeSettingsButton = settingsPanel.add("button", undefined, "Back to Effect List");
        closeSettingsButton.alignment = ["fill", "top"];

        var infoGroup = settingsPanel.add("panel", undefined, "Info");
        infoGroup.orientation = "column";
        infoGroup.alignment = ["fill", "top"];
        infoGroup.alignChildren = ["left", "top"];
        infoGroup.add("statictext", undefined, "AE_EffectExplorer " + scriptInfo.version);
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
    };
    


    function updateDisplay() {
        effectsTree.removeAll();
        if (groupByEffect.value) {
            displayEffectsByEffect();
        } else {
            displayEffectsByComp();
        }
    };



    function collectAndDisplayEffects() {
        projectData = {
                effects: {},
                comps: {}
            };
        app.beginUndoGroup("Collect Effects");
        
        var compsToProcess = searchAllComps.value ? getAllComps() : getSelectedComps();
        
        for (var i = 0; i < compsToProcess.length; i++) {
            processComposition(compsToProcess[i]);
        }
        
        app.endUndoGroup();
        displayEffects();
    };

    function getAllComps() {
        var allComps = [];
        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);
            if (item instanceof CompItem) {
                allComps.push(item);
            }
        }
        return allComps;
    };

    function getSelectedComps() {
        var selectedComps = [];
        for (var i = 0; i < app.project.selection.length; i++) {
            var item = app.project.selection[i];
            if (item instanceof CompItem) {
                selectedComps.push(item);
            }
        }
        return selectedComps;
    };

    function processComposition(comp, parentCompName) {
        parentCompName = parentCompName || null; // This is how you do default params in extendscript

        if (!projectData.comps[comp.name]) {
            projectData.comps[comp.name] = {
                effects: {},
                nestedComps: [],
                totalEffectInstances: 0
            };
        }

        for (var i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);
            if (layer.enabled) {
                if (layer instanceof AVLayer && layer.source instanceof CompItem) {
                    projectData.comps[comp.name].nestedComps.push(layer.source.name);
                    processComposition(layer.source, comp.name);
                } else {
                    processLayer(layer, comp.name);
                }
            }
        }
    };

    function showEffectInfo(matchName) {
        var effect = projectData.effects[matchName];
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
    }

    function processLayer(layer, compName) {
        var effects = layer.property("ADBE Effect Parade");
        if (effects) {
            for (var j = 1; j <= effects.numProperties; j++) {
                var effect = effects.property(j);
                addEffectData(effect, compName, layer.index + ": " + layer.name, layer.enabled && effect.enabled);
            }
        }
    };

    // Populate projectData with effect data while considering relations and updating counts
    function addEffectData(effect, compName, layerName, isEnabled) {
        var matchName = effect.matchName;
        var displayName = effect.name;

        // Update project-wide effect data
        if (!projectData.effects[matchName]) {
            projectData.effects[matchName] = {
                displayName: displayName,
                totalInstances: 0,
                enabledInstances: 0,
                comps: {}
            };
        }
        if (!projectData.effects[matchName].comps[compName]) {
            projectData.effects[matchName].comps[compName] = {
                layers: {},
                totalInstances: 0,
                enabledInstances: 0
            };
        }
        if (!projectData.effects[matchName].comps[compName].layers[layerName]) {
            projectData.effects[matchName].comps[compName].layers[layerName] = {
                instances: 0,
                enabledInstances: 0,
                enabled: isEnabled
            };
        }
    
        // Update comp utilizing-layer and total instance counts per effect 
        projectData.effects[matchName].totalInstances++;
        projectData.effects[matchName].comps[compName].totalInstances++;
        projectData.effects[matchName].comps[compName].layers[layerName].instances++;

        if (isEnabled) {
            projectData.effects[matchName].enabledInstances++;
            projectData.effects[matchName].comps[compName].enabledInstances++;
            projectData.effects[matchName].comps[compName].layers[layerName].enabledInstances++;
        }

        // Update comp-specific effect data
        if (!projectData.comps[compName].effects[matchName]) {
            projectData.comps[compName].effects[matchName] = {
                effects: {},
                totalEffectInstances: 0,
                enabledEffectInstances: 0
            };
        }
        if (!projectData.comps[compName].effects[matchName]) {
            projectData.comps[compName].effects[matchName] = {
                displayName: displayName,
                layers: {},
                totalInstances: 0,
                enabledInstances: 0
            };
        }

        // Update comp's effect counts
        projectData.comps[compName].effects[matchName].totalInstances++;
        projectData.comps[compName].totalEffectInstances++;

        if (isEnabled) {
            projectData.comps[compName].effects[matchName].enabledInstances++;
            projectData.comps[compName].enabledEffectInstances++;
        }
    };
    
    // called by refresh button, calls correct tree rebuild function based on specified grouping
    function displayEffects() {
        effectsTree.removeAll();

        if (groupByEffect.value) {
            displayEffectsByEffect();
        } else {
            displayEffectsByComp();
        }
    };

    // helper function to hide redundant counts
    function formatNodeLabel(name, uniqueCount, totalCount) {
        if (uniqueCount === totalCount) {
            return name + " (" + uniqueCount + ")";
        } else {
            return name + " (" + uniqueCount + ") [" + totalCount + "]";
        }
    };

    // Build the filtered effects tree using effect.matchName as the top-level grouping
    function displayEffectsByEffect() {
        var effectsList = Object.keys(projectData.effects).map(function(matchName) {
            return { matchName: matchName, effect: projectData.effects[matchName] };
        });

        effectsList.sort(function(a, b) {
            return b.effect.totalInstances - a.effect.totalInstances;
        });

        effectsList.forEach(function(effectData) {
            var matchName = effectData.matchName;
            var effect = effectData.effect;
            var nodeName = settings.useDisplayName ? effect.displayName : matchName;
            var totalInstances = settings.showDisabled ? effect.totalInstances : effect.enabledInstances;
            var effectNode = effectsTree.add("node", formatNodeLabel(nodeName, Object.keys(effect.comps).length, totalInstances));
            effectNode.matchName = matchName;

            var compsList = Object.keys(effect.comps).map(function(compName) {
                return { name: compName, data: effect.comps[compName] };
            });

            compsList.sort(function(a, b) {
                return b.data.totalInstances - a.data.totalInstances;
            });

            compsList.forEach(function(compData) {
                var compName = compData.name;
                var compNodeData = compData.data;
                var compTotalInstances = settings.showDisabled ? compNodeData.totalInstances : compNodeData.enabledInstances;
                var compNode = effectNode.add("node", formatNodeLabel(compName, Object.keys(compNodeData.layers).length, compTotalInstances));

                var layersList = Object.keys(compNodeData.layers).map(function(layerName) {
                    return { name: layerName, data: compNodeData.layers[layerName] };
                });

                layersList.sort(function(a, b) {
                    return parseInt(a.name.split(':')[0]) - parseInt(b.name.split(':')[0]);
                });

                layersList.forEach(function(layerData) {
                    var layerName = layerData.name;
                    var layerNodeData = layerData.data;
                    if (settings.showDisabled || layerNodeData.enabled) {
                        var layerInstances = settings.showdisabled ? layerNodeData.instances : layerNodeData.enabledInstances;
                        var layerItem = compNode.add("item", layerName + " (" + layerInstances + ")");
                        if (!layerNodeData.enabled) {
                            layerItem.enabled = false;
                        }
                    }
                });
            });

            effectNode.addEventListener('dblclick', function() { showEffectInfo(matchName); });
        });
    };

    // Build the filtered effects tree using comp.name as the top-level grouping
    // Unfinished / broken; needs disabled logic and new count logic
    function displayEffectsByComp() {
        for (var compName in projectData.comps) {
            var comp = projectData.comps[compName];
            compNode = effectsTree.add("node", compName + " (" + Object.keys(comp.effects).length = ") [" + comp.totalEffectInstances + "]");

            for (var matchName in comp.effects) {
                var effect = comp.effects[matchName];
                var effectNode = compNode.add("node", matchName + " (" + Object.keys(effect.layers).length + ") [" + effect.totalInstances + "]");
                effectNode.matchName = matchName;

                for (var layerName in effect.layers) {
                    var layerData = effect.layers[layerName];
                    var layerItem = effectNode.add("item", layerName + " (" + layerData.instances + ")");
                    if (!layerData.enabled) {
                        layerItem.enabled = false;
                    }
                }
            }
        }
    };



    buildUI();
    collectAndDisplayEffects();
};

effectsChecker(this);