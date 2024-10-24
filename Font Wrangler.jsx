// Phil's Font Wrangler.jsx v1.0.0
// lists fonts used in a comp

// limitation: can only look at font set on first character of text layer 
// limitation: cannot look at fonts set by effects like Numbers, Red Giant effects, etc. 
// TODO: search all comps

function fontWrangler(thisObj) {

var compDropdown, fontList;
var projectComps = [];

function buildUI() {

	var panel = (thisObj instanceof Panel) ? thisObj : new Window("palette", "Font Wrangler", undefined, {resizeable: true});
	panel.orientation = "column";
	panel.spacing = 8;
	panel.margins = 8;
	panel.preferredSize.width = 420;

	var selectCompGroup = panel.add("group");
	selectCompGroup.alignChildren = "center";
	selectCompGroup.alignment = ["fill", "top"];
	selectCompGroup.add("statictext", undefined, "Select Composition:");
	compDropdown = selectCompGroup.add("dropdownlist", undefined, []);
	compDropdown.preferredSize.width = 280;

	var refreshButton = selectCompGroup.add("button", undefined, "Search Fonts");

	fontList = panel.add("listbox", undefined, 'direct',
		{numberOfColumns: 2, showHeaders: true,
		columnTitles: ['Layer', 'Font Name']});
	fontList.alignment = ["fill", "fill"];
	fontList.preferredSize.height = 169;

	populateCompDropdown();

	refreshButton.onClick = function() {
		if (compDropdown.selection !== null) {
			updateFontList(projectComps[compDropdown.selection.index]);
		} else {
			alert("Please select a composition first.");
		}
	};
	panel.layout.layout(true);
	panel.layout.resize();
	panel.onResizing = panel.onResize = function() {
		this.layout.resize();
	};
	if (panel instanceof Window) {
		panel.show();
	} else {
		panel.layout.layout(true);
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

function updateFontList(comp) {
	fontList.removeAll();
	var fontRecord = [];
	// fontRecord.push({layerName: "Layer Name", layerIndex: 1, fontName: "Font Name"});

	for (var i = 1; i <= comp.numLayers; i++) {
		var layer = comp.layer(i);
		if (layer instanceof TextLayer && layer.text.sourceText) {
			var entry = {
				layerName: layer.name,
				layerIndex: layer.index,
				fontName: layer.text.sourceText.value.font
			}
				fontRecord.push(entry);
		}
	}
	populateFontList(fontRecord);
}

function populateFontList(fontRecord) {
	for (entry in fontRecord) {
		if (fontRecord[entry].layerName !== undefined) {
		var item = fontList.add("item", fontRecord[entry].layerIndex + ": " + fontRecord[entry].layerName);
		item.subItems[0].text = fontRecord[entry].fontName;
		}
	}
};

buildUI();

};

fontWrangler(this);