#import "chooser.js"

// Namespace: Loki.Cleanup
// All things having to do with cleaning up documents.
Loki.Cleanup = {
	// var: (Loki.Chooser) filters
	// All builtin cleanup filters.
	filters: new Loki.Chooser(),
	
	// Function: filter
	// Cleans up a portion of an HTML document (or a whole document), beginning
	// at +root+.
	//
	// Parameters:
	//     (Array) filters - the cleanup filters to run
	//     (Document|Element) root - the node who, along with its descendants,
	//                               will be cleaned up
	//     (Object) settings - cleanup settings
	//     (Boolean) [live=false] - set +live+ to true if the cleanup is
	//                              being performed on a document that is
	//                              currently being edited
	filter: function filter_html(filters, root, settings, live) {
		$extend(root);
		
		var i, len = filters.length;
		var filter, preflight, elements;
		
		var builtin_actions = {
			remove: function remove_node(node) {
				node.parentNode.removeChild(node);
			},
			
			remove_tag: function remove_tag(element) {
				element.replaceWithChildren();
			}
		};
		
		for (i = 0; i < len; i++) {
			filter = filters[i];
			if (live && typeof(filter.run_on_live) != 'undefined') {
				if (!filter.run_on_live)
					continue;
			}
			
			preflight = (typeof(filter.preflight) == 'function') ?
				filter.preflight(settings) :
				null;
			
			elements = root.querySelectorAll(filter.selector);
			elements.forEach(function(el) {
				if (filter.test && !filter.test(el, settings, preflight))
					return;
				if (typeof(filter.action) == 'string') {
					builtin_actions[filter.action](el);
				} else {
					filter.action(el);
				}
			});
		}
	},
	
	// Function: addFilter
	// Adds a cleanup filter.
	//
	// Parameters:
	//     (String) handle - the task's selection ID
	//     (Object) task - the cleanup task itself
	addFilter: function add_filters(handle, filter) {
		Loki.Cleanup.filters.add(handle, filter);
	},
	
	// Function: addFilters
	// Adds multiple cleanup filters.
	//
	// Parameters:
	//     ({String => Object}) filters - the cleanup filters
	addFilters: function add_filter_tasks(filters) {
		Loki.Object.enumerate(filters, Loki.Cleanup.addFilter); // zing!
	}
};

#import "filters/basic.js"
