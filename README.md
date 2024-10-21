# Phordan's After Effects ScriptUI Panels
Welcome! The `phordan_ae_scripts` repo is where I'm sharing the ScriptUI panels I create for my own needs. When choosing ScriptUI over CEP extensions I usually focus on simple, distributable, single-purpose utilities for techniques I use often or find unique, as well as QC tools like Effect Explorer; I try to make anything I make in ScriptUI as easy to use as possible.

## Scripts:
### EfExDep Lite
_**Effect Explorer and Dependency Checker**_
- A *QC/Troubleshooting tool* that lets you see all the effects used in your project, with options for search-scope and view-grouping. 
- **Dependency Checker** focuses only on one Comp, listing _all_ of the unique effect(s) it relies on in this manner:
   - _**"Direct"**_ dependencies, meaning effects used _directly on layers_ in the Target Comp. And...
   - _**"Nested"**_ effect dependencies, meaning effects used in comp(s) the target Comp contains, and is therefore reliant on in order to render in it's intended form.
The main _Tree View_ is great for hunting down Effect locations, and seeing what fx the project uses in general, but look to _Dependency Checker_ for an accurate tell of "What effects does this comp need?" when handing off work, prepping to render on a different machine, or other QC situations.

### Phil's Toolbox
_**Various Uncommon Utilities**_  
This is a multi-purpose ScriptUI Panel that has a few different macros related to _applying expressions on properties_. 
It lets you apply some pretty powerful expression-based features I use often pretty easily:
- **Number Formatter**
   - _"Social Media" auto number formatting_, i.e. ` 1,232 -> 1.2k `, ` 6.2M `, ` 526k `, etc.
- **Highlight Hashtags / Hide Emoji**
   - A couple of the Expression Selector utilities I made to help with social media UI templates, but can be applied to other text-highlight situations. Also provides the core functionality for "Fixing the Emoji Problem" when using character indexes in After Effects.
- **Squircle Generator**
   - Generates super-ellipse style "Squircle" rectangle shape made famous by Apple and their refusal to use traditionally-calculated rounded Rectangles.
   - Has controls for size, roundness, and tension (0.5 represents traditional rounded rectangle).   

---

>[!IMPORTANT]
> These script panels may be incomplete or works in progress. With that said, I try my best to ensure the info here about them is as detailed and accurate as can be.
> 
> Please look at each individual script's page for more details on availability of functions, planned features, known issues, documentation, and more.
