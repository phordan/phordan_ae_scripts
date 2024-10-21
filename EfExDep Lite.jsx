// EfExDep Lite.jsx v1.0.0
// Phordan 2024

// This script catalogs effects used in the active project, and the composition(s) and layer(s) they are applied to. It also provides a full recursive dependency checker for single compositions.

// Features (v1.0.0):
// - displays the effects used in the project, grouped in a collabsible tree structure.
// - option to use Effects or Comps as the top-level grouping
// - option to search through all comps or only those selected in the *Project* panel. 
// - shows unique and total effect instances per comp, effect, and layer
// - satus & summary at top & bottom of panel
// - Separate Dependency Checker to focus on a single composition
//     - Show direct fx dependencies AND nested dependencies from any comps within the target comp
//     - Ensures disabled effects are excluded from dependencies, unlike the tree view
//
// - Available settings:
//     - show/hide disabled layers & effect instances
//     - use effect's displayName or matchName
//          - *when an effect uses multiple display names across the project (like if it was renamed), the matchName is always used*

// - Known Issues/Planned Features:
//     - displayName in Tree View only uses the first displayName found in the project, not all of them
//     - Disabled effects still create "Effect" node in tree view
//     - showing disabled effects does represent them in the tree view, but may have unexpected behavior & instance counts
//     - Haven't implemented emabled/disabled instance count in summary yet
//
// - TODO fix/features:
//     - Add Sorting options
//     - Add Filtering options like:
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


function effectsChecker(thisObj) {
        // declare anything used in multiple functions like data/controls/settings
        var win, effectsTree, refreshButton, settingsButton, serarchStatusText, summaryText, searchByGroup;
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
            effectInstanceTotal: 0,
			effectEnabledInstanceTotal: 0,
			effectDisabledInstanceTotal: 0
        };
        var settings = {
            useDisplayName: true,
            showDisabled: false
        };
        var scriptInfo = {
            version: "1.0.0",
            author: "Phordan",
            repoLink: "https://github.com/phordan/phordan_ae_scripts/blob/main/EfExDep%20Lite.jsx",
            description: "Catalogs effects used in your project, and indicates the composition(s) and layer(s) they are applied to.",
        };

    // main UI / init function
    function buildUI() {
        win = (thisObj instanceof Panel) ? thisObj : new Window("palette", "EfExDep Lite", undefined, {resizeable: true});
        win.orientation = "column";
        win.alignChildren = ["fill", "top"];
        win.spacing = 8;
        win.margins = 6;
        win.preferredSize = [400, 600];

        var mainPanel = win.add("group");
        mainPanel.orientation = "stack";
        mainPanel.margins = [0, -5, 0, -4];
        mainPanel.alignment = ["fill", "fill"];
        mainPanel.alignChildren = ["fill", "fill"];

        
        var catalogPanel = mainPanel.add("group");
        catalogPanel.margins = [0, -6, 0, -4];
        catalogPanel.orientation = "column";
        catalogPanel.alignment = ["fill", "fill"];
        catalogPanel.alignChildren = ["fill", "top"];

        var optionsPadContainer = catalogPanel.add("group");
        optionsPadContainer.orientation = "column";
        optionsPadContainer.alignment = ["fill", "top"];
        optionsPadContainer.margins = [8, 8, 8, 8];
        var optionsGroup = catalogPanel.add("panel", undefined, "Effect Tree Options");
        optionsGroup.margins = [8, 4, 4, 6];
        optionsGroup.spacing = 2;

        var searchByGroup = optionsGroup.add("group");
        searchByGroup.orientation = "row";
        searchByGroup.alignment = ["fill", "top"];
        searchByGroup.alignChildren = ["left", "center"];
        searchByGroup.margins = [0,4,0,-2];
        searchByGroup.spacing = 2;
        var searchByLabel = searchByGroup.add("statictext", undefined, "Scope:");
        searchByGroup.helpTip = "Search entire project or only the comps selected in the *Project* panel";
        var searchByButtonGroup = searchByGroup.add("group");
        searchByButtonGroup.orientation = "row";
        searchByButtonGroup.alignment = ["fill", "bottom"];
        searchByButtonGroup.margins = [6, 4, 0, 0];
        searchAllComps = searchByButtonGroup.add("radiobutton", undefined, "Project");
        searchSelectedComps = searchByButtonGroup.add("radiobutton", undefined, "Selected Comp(s)");        
        searchAllComps.value = true;        

        var groupByGroup = optionsGroup.add("group");
        groupByGroup.orientation = "row";
        groupByGroup.alignment = ["fill", "top"];
        groupByGroup.add("statictext", undefined, "Group by:");
        groupByEffect = groupByGroup.add("radiobutton", undefined, "Effect");
        groupByComp = groupByGroup.add("radiobutton", undefined, "Comp");
        groupByEffect.value = true;
        groupByComp.value = false;
        
        var buttonGroup = catalogPanel.add("group");
        buttonGroup.orientation = "row";
        buttonGroup.alignment = ["fill", "top"];
        refreshButton = buttonGroup.add("button", undefined, "Update Tree");
        refreshButton.alignment = ["fill", "top"];
        dependencyButton = buttonGroup.add("button", undefined, "Dependency Check");

        settingsButton = buttonGroup.add("button", undefined, "Settings");

        searchStatusText = catalogPanel.add("statictext", undefined, 'Click "Update Tree" to Explore Effect Instances!');

        effectsTree = catalogPanel.add("treeview", undefined, []);
        effectsTree.alignment = ["fill", "fill"];
        effectsTree.margins = [10, 20, 30, 40];

        var summaryGroup = catalogPanel.add("group");
        summaryGroup.orientation = "column";
        summaryGroup.alignment = ["fill", "bottom"];
        summaryGroup.alignChildren = ["fill", "center"];
        summaryText = summaryGroup.add("statictext", undefined, "Refresh to find Effects...\r\r", {multiline: true});

        settingsPanel = mainPanel.add("group");
        settingsPanel.margins = [8,8,8,8];

        settingsPanel.orientation = "column";
        settingsPanel.alignment = ["fill", "fill"];
        settingsPanel.alignChildren = ["fill", "top"];
        settingsPanel.visible = false;

        var closeSettingsButton = settingsPanel.add("button", undefined, "Back to Effect List");
        closeSettingsButton.alignment = ["fill", "top"];

        var nameGroup = settingsPanel.add("panel", undefined, "For Effects, Use:");
        nameGroup.orientation = "row";
        nameGroup.alignment = ["fill", "top"];
        nameGroup.margins = [12,16,8,10];
        useDisplayNameRadio = nameGroup.add("radiobutton", undefined, "Display Name");
        useMatchNameRadio = nameGroup.add("radiobutton", undefined, "Match Name");
        useDisplayNameRadio.value = settings.useDisplayName;
        useMatchNameRadio.value = !settings.useDisplayName;

        showDisabledCheckbox = settingsPanel.add("checkbox", undefined, "Show Disabled Layers/Effect instances");
        showDisabledCheckbox.value = settings.showDisabled;


        var infoGroup = settingsPanel.add("panel", undefined, "Info");
        infoGroup.orientation = "column";
        infoGroup.alignment = ["fill", "top"];
        infoGroup.alignChildren = ["fill", "top"];
        infoGroup.add("statictext", undefined, "AE Effect Explorer - v" + scriptInfo.version);
        infoGroup.add("statictext", undefined, "Created by " + scriptInfo.author);
        infoGroup.add("statictext", undefined, "Source code:" + "\r" + scriptInfo.repoLink, {multiline: true});
        infoGroup.add("statictext", undefined, scriptInfo.description, {multiline: true});
    

        refreshButton.onClick = collectAndDisplayEffects;
        dependencyButton.onClick = function() {
            dependencyChecker(thisObj);
        };
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
            win.show();
        } else {
            win.layout.layout(true);
        }
    };

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
    };

    function updateDisplay() {
        effectsTree.removeAll();
        if (groupByEffect.value) {
            displayEffectsByEffect();
        } else {
            displayEffectsByComp();
        }
    };

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
        statusText += " ";
        groupByEffect.value ? statusText += "— by Effect" : statusText += "– by Composition";

        searchStatusText.text = statusText;
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
                effectInstanceTotal: 0,
				effectEnabledInstanceTotal: 0,
				effectDisabledInstanceTotal: 0		
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
		if (groupByEffect.value) {
			displayEffectsByEffect();
		} else {
			displayEffectsByComp();
		}
        updateSummary();
    };

	function processComposition(comp) {
		if (!queryData.comps[comp.name]) {
			queryData.comps[comp.name] = {
				effectCount: 0,
				enabledEffectCount: 0,
				nestedInComps: [],
				containsNestedComps: false
			};
			summaryData.compTotal++;
		}


		for (var i = 1; i <= comp.numLayers; i++) {
			var layer = comp.layer(i);
			if (layer instanceof AVLayer && layer.source instanceof CompItem) {
				var temp = "yeehaw";
				// processComposition(layer.source, comp.name);
			}
			processLayer(layer, comp.name);
		}
	}
    // helper function to hide redundant counts
    function formatNodeLabel(name, uniqueCount, totalCount) {
        if (totalCount === undefined || uniqueCount === totalCount) {
            return name + " (" + uniqueCount + ")";
        } else {
            return name + " (" + uniqueCount + ") [" + totalCount + "]";
        }
    }

	function updateSummary() {
		var effectCount = Object.keys(queryData.effects).length;
		var compCount = Object.keys(queryData.comps).length;
		var instanceCount = summaryData.effectInstanceTotal;
		var enabledInstanceCount = summaryData.effectEnabledInstanceTotal;
		var disabledInstanceCount = summaryData.effectDisabledInstanceTotal;

		var summaryString = effectCount + (effectCount === 1 ? " effect" : " effects") + " across " +
							compCount + (compCount === 1 ? " comp" : " comps") + "\r" +
							instanceCount + " total effect instance" + (instanceCount === 1 ? "" : "s"); // + "\r" +
							//enabledInstanceCount + " enabled, " + disabledInstanceCount + " disabled";

		summaryText.text = summaryString;
	}

	function processLayer(layer, compName) {
		var layerId = compName + "_" + layer.index;
		var effects = layer.property("ADBE Effect Parade");
		if (effects) {
			for (var j = 1; j <= effects.numProperties; j++) {
				var effect = effects.property(j);
				addEffectData(effect, compName, layerId, layer.name, layer.enabled, effect.enabled, j);
			}
		}
	}

	function addEffectData(effect, compName, layerId, layerName, isLayerEnabled, isEffectEnabled, effectIndex) {
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
        if (isLayerEnabled && isEffectEnabled) {
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
        if (isLayerEnabled && isEffectEnabled) {
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
        if (isLayerEnabled && isEffectEnabled) {
            queryData.comps[compName].enabledEffectCount++;
        }

        // Update layer data
        if (!queryData.layers[layerId]) {
            queryData.layers[layerId] = {
                name: layerName,
                index: parseInt(layerId.split('_')[1]),
                effectCount: 0,
                enabledEffectCount: 0,
                isEnabled: isLayerEnabled
            };
        }

        queryData.layers[layerId].effectCount++;
        if (isEffectEnabled) {
            queryData.layers[layerId].enabledEffectCount++;
        }

		// Add instance
		queryData.instances.push({
			effectMatchName: matchName,
			compName: compName,
			layerId: layerId,
			effectIndex: effectIndex,
			isLayerEnabled: isLayerEnabled,
			isEffectEnabled: isEffectEnabled
		});

		summaryData.effectInstanceTotal++;
	}

	function groupBy(array, key) {
		return array.reduce(function(result, currentValue) {
			(result[currentValue[key]] = result[currentValue[key]] || []).push(currentValue);
			return result;
		}, {});
	}

    // Build the filtered effects tree using effect.matchName as the top-level grouping
    function displayEffectsByEffect() {
        effectsTree.removeAll();

        var effectsList = Object.keys(queryData.effects).map(function (matchName) {
            return { matchName: matchName, effect: queryData.effects[matchName] };
        });

        effectsList.sort(function (a, b) {
            return b.effect.instanceCount - a.effect.instanceCount;
        });

        effectsList.forEach(function (effectData) {
            var matchName = effectData.matchName;
            var effect = effectData.effect;
            var nodeName = settings.useDisplayName ? effect.displayName : matchName;
            var totalInstances = settings.showDisabled ? effect.instanceCount : effect.enabledInstanceCount;
            var effectNode = effectsTree.add("node",formatNodeLabel(nodeName, Object.keys(effect.comps).length, totalInstances), {expanded: true});
            effectNode.matchName = matchName;
            
            Object.keys(effect.comps).forEach(function (compName) {
            var compData = effect.comps[compName];
            var compInstances = queryData.instances.filter(function (instance) {
                return (
                instance.effectMatchName === matchName &&
                instance.compName === compName &&
                (settings.showDisabled || (instance.isLayerEnabled && instance.isEffectEnabled))
            );
            });

            var layerGroups = groupBy(compInstances, "layerId");
            var numLayers = Object.keys(layerGroups).length;
            var totalCompInstances = settings.showDisabled
                ? compData.instanceCount
                : compData.enabledInstanceCount;

            var compNode = effectNode.add(
                "node",
                formatNodeLabel(compName, numLayers, totalCompInstances)
            );

            Object.keys(layerGroups).forEach(function (layerId) {
                var layerInstances = layerGroups[layerId];
                var layer = queryData.layers[layerId];
                var layerNode = compNode.add("node", layer.index + ": " + formatNodeLabel(layer.name, layerInstances.length));

                if (!layer.isEnabled) {
                    layerNode.enabled = false;
                }

                layerInstances.forEach(function (instance) {
                var instanceItem = layerNode.add(
                    "item",
                    instance.effectIndex + ": " + effect.displayName
                );

                if (!instance.isEffectEnabled) {
                    instanceItem.enabled = false;
                }
                });

            });
            });
        });
    }

    // Build the filtered effects tree using comp.name as the top-level grouping
    function displayEffectsByComp() {
        effectsTree.removeAll();

        Object.keys(queryData.comps).forEach(function (compName) {
            var comp = queryData.comps[compName];
            var displayedEffectCount = settings.showDisabled ? comp.effectCount : comp.enabledEffectCount;
            var compNode = effectsTree.add("node", formatNodeLabel(compName, displayedEffectCount, comp.effectCount));

            if (comp.nestedInComps.length > 0) {
                compNode.add("item", "* Nested in: " + comp.nestedInComps.join(", "));
            }

            var compInstances = queryData.instances.filter(function (instance) {
                return instance.compName === compName;
            });

            var effectGroups = groupBy(compInstances, "effectMatchName");
            Object.keys(effectGroups).forEach(function (matchName) {
                var effectInstances = effectGroups[matchName];
                var effect = queryData.effects[matchName];
                var nodeName = settings.useDisplayName ? effect.displayName : matchName;
                
                var enabledEffectInstances = effectInstances.filter(function(instance) {
                    return instance.isLayerEnabled && instance.isEffectEnabled;
                });
                
                var displayedInstances = settings.showDisabled ? effectInstances.length : enabledEffectInstances.length;
                
                if (displayedInstances > 0) {
                    var effectNode = compNode.add("node", formatNodeLabel(nodeName, displayedInstances, effectInstances.length));

                    var layerGroups = groupBy(effectInstances, "layerId");
                    Object.keys(layerGroups).forEach(function (layerId) {
                        var layerInstances = layerGroups[layerId];
                        var layer = queryData.layers[layerId];
                        
                        var enabledLayerInstances = layerInstances.filter(function(instance) {
                            return instance.isLayerEnabled && instance.isEffectEnabled;
                        });
                        
                        var displayedLayerInstances = settings.showDisabled ? layerInstances.length : enabledLayerInstances.length;
                        
                        if (displayedLayerInstances > 0) {
                            var layerNode = effectNode.add("node", layer.index + ": " + 
                                formatNodeLabel(layer.name, displayedLayerInstances, layerInstances.length));

                            layerInstances.forEach(function (instance) {
                                if (settings.showDisabled || (instance.isLayerEnabled && instance.isEffectEnabled)) {
                                    var instanceItem = layerNode.add("item", instance.effectIndex + ": " + effect.displayName);
                                    if (!instance.isEffectEnabled) {
                                        instanceItem.enabled = false;
                                    }
                                }
                            });
                        }
                    });
                }
            });

        });
    }

	buildUI();

}

function dependencyChecker(thisObj) {
    var win, compDropdown, treeGroup, dependencyTree, refreshButton;
    var nestedTally = 0;
    var projectComps = [];

    function buildUI() {
        win = (thisObj instanceof Panel) ? thisObj : new Window("palette", "Dependency Checker Lite", undefined, {resizeable: true});
        win.orientation = "column";
        win.alignment = ["fill", "fill"];
        win.spacing = 6;
        win.margins = 8;
        win.preferredSize.height = 500;

        var selectCompGroup = win.add("group");
        selectCompGroup.alignChildren = "center";
        selectCompGroup.add("statictext", undefined, "Select Composition:");
        compDropdown = selectCompGroup.add("dropdownlist", undefined, []);
        compDropdown.preferredSize.width = 280;

        refreshButton = selectCompGroup.add("button", undefined, "Refresh");

        directList = win.add("group")
        directList.orientation = "column";
        directList.alignment = ["fill", "fill"];

        searchTitle = directList.add("statictext", undefined, "Select a Composition to view its dependencies.");
        searchTitle.alignment = ["fill", "top"];
        dependencyTree = directList.add("listbox", undefined, 'direct',
            {numberOfColumns: 2, showHeaders: true,
            columnTitles: ['Display Name', 'Match Name']});
        dependencyTree.alignment = ["fill", "fill"];

        nestedList = win.add("group")
        nestedList.orientation = "column";
        nestedList.alignment = ["fill", "fill"];

        nestedTitle = nestedList.add("statictext", undefined, "Nested Dependencies will be shown here.")
        nestedTitle.alignment = ["fill", "top"];
        nestedTree = nestedList.add("listbox", undefined, 'nested',
            {numberOfColumns: 3, showHeaders: true,
            columnTitles: ['Comp', 'Display Name', 'Match Name']});
        nestedTree.alignment = ["fill", "fill"];

        refreshButton.onClick = function() {
            if (compDropdown.selection !== null) {
                updateSearchTitle("");
                updateNestedTitle("");
                nestedTally = 0;
                updateDependencyTree(projectComps[compDropdown.selection.index]);
            } else {
                alert("Please select a composition first.");
            }
        };

        populateCompDropdown();
        win.onResizing = win.onResize = function() {
            this.layout.resize();
        };
        if (win instanceof Window) {
            win.show();
        } else {
            win.layout.layout(true);
        }
    }

    function populateCompDropdown() {
        projectComps = [];
        for (var i = 1; i <= app.project.numItems; i++) {
            if (app.project.item(i) instanceof CompItem) {
                projectComps.push(app.project.item(i));
                compDropdown.add("item", app.project.item(i).name);
            }
        }
        if (compDropdown.items.length > 0) {
            compDropdown.selection = 0;
        }
    }

    function updateSearchTitle(title) {
        searchTitle.text = title;
        win.layout.layout(true);
    }
    function updateNestedTitle(title) {
        nestedTitle.text = title;
        win.layout.layout(true);
    }

    function updateDependencyTree(comp) {
        dependencyTree.removeAll();
        nestedTree.removeAll();
        var dependencies = checkDependencies(comp);
        nestedCompsWithDepsCount = dependencies.nestedComps.length;
        populateTreeView(dependencyTree, comp.name, dependencies, nestedCompsWithDepsCount);

        if (nestedCompsWithDepsCount > 0) {
            dependencies.nestedComps.forEach(function(nestedComp) {
            var nTally = populateNestedView(nestedTree, nestedComp.name, nestedComp.dependencies);
            // for some reason we didn't target "no nested comps" proper, so 1st part of ternary here doesn't call correctly.
            updateNestedTitle(
                nTally + " Nested Effect dependenc" + ( nTally === 1 ? "y" : "ies") +
                " found in " + nestedCompsWithDepsCount + " comp" + (nestedCompsWithDepsCount === 1 ? " " : "s ") +
                "within " + '"' + comp.name + '"'
            );
            })
        } else {
            if (nestedCompsWithDepsCount = 0) updateNestedTitle("No new Effect dependencies in nested comps.");
        }
        win.layout.layout(true);
    }

    function checkDependencies(comp, processedComps) {
        processedComps = processedComps || {};
        if (processedComps[comp.id]) {
            return null; // Avoid circular dependencies
        }
        processedComps[comp.id] = true;

        var dependencies = {
            effects: {},
            nestedComps: []
        };

        for (var i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);
            if (layer.effect) {
                for (var j = 1; j <= layer.effect.numProperties; j++) {
                    var effect = layer.effect(j);
                    if (!dependencies.effects[effect.matchName]) {
                        dependencies.effects[effect.matchName] = effect.name;
                    }
                }
            }
            if (layer.source instanceof CompItem) {
                var nestedDependencies = checkDependencies(layer.source, processedComps);
                if (nestedDependencies) {
                    dependencies.nestedComps.push({
                        name: layer.source.name,
                        dependencies: nestedDependencies
                    });
                }
            }
        }

        return dependencies;
    }

    function populateTreeView(tree, compName, dependencies) {
        var directEffectCount = Object.keys(dependencies.effects).length;
        updateSearchTitle(directEffectCount + ' Direct Effect dependenc' + ( directEffectCount === 1 ? 'y' : 'ies') + ' found in ' + '"' + compName + '"');
        
        if (directEffectCount > 0) {
    
            for (var matchName in dependencies.effects) {
                var item = tree.add("item", dependencies.effects[matchName]);
                item.subItems[0].text = matchName;
            }
        } 
    }
        
    function populateNestedView(tree, compName, dependencies) {
        var nestedEffectCount = Object.keys(dependencies.effects).length;
        
        if (nestedEffectCount > 0) {
    
            for (var matchName in dependencies.effects) {
                var item = tree.add("item", compName);
                item.subItems[0].text = dependencies.effects[matchName];
                item.subItems[1].text = matchName;
                nestedTally++;
            }
        } 
        return nestedTally > 0 ? nestedTally : false;
    }

    

    buildUI();
}


effectsChecker(this);