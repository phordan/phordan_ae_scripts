// pack all the "Expressions to Apply" into functions.
// this helps handle line breaks/indentation, but also allows args passed in 
function socialMediaFormatExpr(count) {
    return [
        (count ? "var count = " + count : "var count = 1200 ") + "// Enter or link a number here!",
        "function condenseNumber(num) {",
        "   if (num < 1000) return Math.round(num).toString();",
        "",
        "   if (num < 100000) {",
        "       var condensed = (num / 1000).toFixed(1);",
        "       return condensed.endsWith('.0') ?",
        "           condensed.slice(0, -2) + 'k' :",
        "           condensed + 'k';",
        "   }",
        "",
        "   if (num < 1000000) {",
        "       return Math.round(num / 1000) + 'k';",
        "   }",
        "",
        "   var condensed = (num / 1000000).toFixed(1);",
        "   return condensed.endsWith('.0') ?",
        "       condensed.slice(0, -2) + 'M' :",
        "       condensed + 'M';",
        "}",
        "condenseNumber(count);",
    ];
}

function pinLayerExpr(padding, refLayer, pinEdge) {
	"// adjust padding here if you want"
	(padding ? "var padding = " + padding + ";" : "var padding = 0;"),
	(refLayer ? "var refLayer = " + "thisComp.layer('" + refLayer.name + "');" : ("var refLayer = thisComp.layer(index " + (refBelow ? "+ 1);" : "- 1);" ))),
	"var refRect = refLayer.sourceRectAtTime(time, false);",
	( pinBottom.value ? "var refBottom = refLayer.toComp([0, refRect.top + refRect.height])[1];" 
				: "var refRight = refRect.toComp([refRect.left + refRect.width, 0])[0];"
	),
	( pinBottom.value ? "refBottom - padding" : "refRight + padding")
}

function squirclePathExpr(pathID) {
	return [
	// TODO: transfer that shiz
	];
}

function highlightHashtagsExpr() {
	return [
	// TODO: transfer that shiz
	];
}

function hideEmojiExpr() {
	return [
	// TODO: transfer that shiz
	];
}

// handling the text based macros...
function applyTextExpr(expr, count, prop) {
    var comp = app.project.activeItem;
    if (!(comp && comp instanceof CompItem)) {
        alert("Please open a composition.");
        return;
    }
    var selectedLayers = comp.selectedLayers;
    if (selectedLayers.length !== 1) {
        alert("Please select exactly one text layer.");
        return;
    }
    
    var layer = selectedLayers[0];
    if (!(layer instanceof TextLayer)) {
        alert("Selected layer must be a text layer.");
        return;
    }
	// we store the expressions to apply as arrays with each line as a string,
	// so when applying it to the prop we "unpack" it by joining them with \n
	var expArr = typeof expr === 'function' ? expr(count) : expr;

	switch (prop) {
		// applying to sourceText is easy for the number format expression
		case 'sourceText':
			layer.property("Source Text").expression = expArr.join("\n");
			break;
		// the ones with animators are a bit more complicated
		case 'color':
			break;
		case 'opacity':
			break;
	}
}

// adding a squircle to a path to a shape layer (& a new one if necessary)
function applySquirclePath(pathID) {
	var comp = app.project.activeItem;
	if (!(comp && comp instanceof CompItem)) {
		alert("Please open a composition.");
		return;
	}
	var selectedLayers = comp.selectedLayers;
	if (selectedLayers.length === 0) {
		// no layers selected, so we need to create a new one
		var layer = comp.layers.addShape();
		layer.name = "Squircle";
		layer.kind = LayerKind.SHAPE;
		selectedLayers = [layer];
		return;
	}
	if (selectedLayers.length !== 1) {
		alert("Please select exactly one shape layer.");
		return;
	}
	var layer = selectedLayers[0];
	if (!(layer instanceof ShapeLayer)) {
		alert("Selected layer must be a shape layer.");
		return;
	}
	return;
};



function createUI(win, layout, functions) {
    function createControl(parent, spec) {
        var control;
        switch (spec.type) {
            case 'button':
                control = parent.add('button', undefined, spec.label);
                if (spec.onClick) {
                    var clickHandler = functions[spec.onClick];
                    control.onClick = function() {
                        clickHandler.call(this, parent);
                    };
                }
                break;
            case 'edittext':
                control = parent.add('edittext', undefined, spec.text || '');
                if (spec.onChange) {
                    var changeHandler = functions[spec.onChange];
                    control.onChange = changeHandler;
                }
                break;
            case 'statictext':
                control = parent.add('statictext', undefined, spec.text);
                break;
            case 'panel':
                control = parent.add('panel', undefined, spec.label);
                if (spec.children) {
                    for (var i = 0; i < spec.children.length; i++) {
                        createControl(control, spec.children[i]);
                    }
                }
                break;
            case 'group':
                control = parent.add('group');
                if (spec.children) {
                    for (var i = 0; i < spec.children.length; i++) {
                        createControl(control, spec.children[i]);
                    }
                }
                break;
            case 'radiobutton':
                control = parent.add('radiobutton', undefined, spec.label);
                if (spec.onChange) {
                    var changeHandler = functions[spec.onChange];
                    control.onChange = changeHandler;
                }
                break;
            case 'dropdownlist':
                control = parent.add('dropdownlist', undefined, spec.items);
                if (spec.onChange) {
                    var changeHandler = functions[spec.onChange];
                    control.onChange = changeHandler;
                }
                break;
        }
        if (spec.properties) {
            for (var key in spec.properties) {
                if (spec.properties.hasOwnProperty(key)) {
                    control[key] = spec.properties[key];
                }
            }
        }
        return control;
    }

    for (var i = 0; i < layout.length; i++) {
        createControl(win, layout[i]);
    }
}

var layout = [
    {
        type: 'panel', 
        label: 'Pin Layer to Reference Layer Edge',
        children: [
            {
                type: 'group',
                children: [
                    { type: 'statictext', text: 'Reference Layer:' },
                    { 
                        type: 'buttonGroup', 
                        properties: { orientation: 'column', onChange: 'validateRefLayer' },
                        children: [
                            { type: 'radiobutton', label: 'Layer Above'  },
                            { type: 'radiobutton', label: 'Layer Below'  },
                            { type: 'radiobutton', label: 'Choose:' },
                        ]    
                    },
                    /*{
                        type: 'dropdownlist',
                        items: app.project.activeItem.layers,
                        onChange: 'validateRefLayer'
                    },*/
                ]
            },
            {
                type: 'dropdownlist', 
                items: ['Top', 'Bottom', 'Left', 'Right'],
                onChange: 'validatePinEdge'
            },
            { type: 'statictext', text: '(Optional) Extra Padding:' },
            {
                type: 'edittext',
                properties: { characters: 5 },
                onChange: 'validatePadding'
            },
            {
                type: 'button',
                label: 'pin sel. Layer to ref. Layer',
                onClick: 'applyPinLayer'
            },

            
        ]
    },
    {
        type: 'panel',
        label: 'Social Media Formatter',
        children: [
            {
                type: 'group',
                children: [
                    { type: 'statictext', text: 'Count:' },
                    { 
                        type: 'edittext', 
                        properties: { characters: 10 },
                        onChange: 'validateCount'
                    }
                ]
            },
            {
                type: 'button',
                label: 'Apply Format',
                onClick: 'applySocialMediaFormat'
            }

        ]
    },
		{
        type: 'panel',
        label: 'Text Selectors/Animators',
        children: [
			{
                type: 'button',
                label: 'Highlight #Hashtags',
                onClick: 'applyHighlightHashtags'
            },
			{
                type: 'button',
                label: 'Hide Emoji',
                onClick: 'applyHideEmoji'
            }
        ]
    },
    {
        type: 'panel',
        label: 'Squircle Generator',
        children: [
            {
                type: 'group',
                children: [
                    { type: 'statictext', text: 'Path name/id:' },
                    { 
                        type: 'edittext', 
						text: 'Squircle',
                        properties: { characters: 15 }
                    }
                ]
            },
            {
                type: 'button',
                label: 'Make Squircle',
                onClick: 'applySquirclePath'
            }

        ]
    },
];
var functions = {
    validateCount: function() {
        this.text = this.text.replace(/[^0-9]/g, '');
    },
    applySocialMediaFormat: function(parent) {
        var count = parent.children[0].children[1].text;
        applyTextExpr(socialMediaFormatExpr, count, "sourceText");
    },
	applySquirclePath: function(parent) {
		var pathID = parent.children[0].children[1].text;
		applySquirclePath(squirclePathExpr, pathID);
	},
	applyHighlightHashtags: function(parent) {
		applyTextExpr(highlightHashtagsExpr, "", "color");
	},
	applyHideEmoji: function(parent) {
		applyTextExpr(hideEmojiExpr, "", "opacity");
	},
    
    validateRefLayer: function(parent) {
        
    },

    validatePinEdge: function(parent) {
        var pinEdge = parent.selection;
        if (pinEdge) {
            parent.enabled = true;
        } else {
            parent.enabled = false;
        }
    },

    validatePadding: function(parent) {
        var padding = parent.text;
        if (padding) {
            parent.enabled = true;
        } else {
            parent.enabled = false;
        }
    },
};

function buildUI(thisObj) {
    var panel = (thisObj instanceof Panel) ? thisObj : new Window("palette", "Expression Applicator", undefined, {resizeable:true});
    panel.orientation = "column";

    createUI(panel, layout, functions);

    panel.layout.layout(true);
    panel.layout.resize();
    panel.onResizing = panel.onResize = function () {
        this.layout.resize();
    };

    if (panel instanceof Window) {
        panel.show();
    } else {
        panel.layout.layout(true);
    }

    return panel;
}

var myPanel = buildUI(this);