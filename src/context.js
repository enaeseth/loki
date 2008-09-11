// Class: Loki.Context
// A Loki editor display context (abstract).
Loki.Context = Class.create({
	// var: (Loki.Editor) editor
	// The Loki editor associated with this context.
	editor: null,
	
	// Constructor: Context
	// Instantiates a context for a particular editor.
	//
	// Parameters:
	//     (Editor) editor - the Loki editor associated with the context object
	initialize: function Context(editor) {
		this.editor = editor;
	},
	
	// Method: enter
	// Called when the context is being entered. The context object should
	// display all necessary UI elements in the Loki editor's root element.
	// At the time this method is called, that root element will be empty.
	//
	// Parameters:
	//     (Element) root - the editor's root element
	//
	// Returns:
	//     (void)
	enter: function context_enter(root) {
		
	},
	
	// Method: exit
	// Called when the context is being exited. The context object should remove
	// any and all Loki UI elements that it has created from the owner document.
	// After this method is called, the editor's root element should be empty.
	//
	// Parameters:
	//     (Element) root - the editor's root element
	//
	// Returns:
	//     (void)
	exit: function context_exit(root) {
		
	}
});

