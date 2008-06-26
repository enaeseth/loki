/**
 * Declares instance variables.
 *
 * @constructor
 *
 * @class A class for massaging a table.
 */
UI.Table_Masseuse = function TableMasseuse()
{
	Util.OOP.inherits(this, UI.Masseuse);
	
	var empty_header_text = 'Column title';
	
	/*
	 * Ensures that the given table follows the thead/tbody/tfoot structure.
	 */
	function normalize_table_structure(table, first_row_is_head)
	{		
		function get_bodies() {
			var bodies;
			var c;
			
			// the tBodies property might be broken under IE8
			if (table.tBodies)
				return table.tBodies;
			
			bodies = [];
			for (var i = 0; i < table.childNodes.length; i++) {
				c = table.childNodes[i];
				
				if (Util.Node.is_tag(c, 'TBODY'))
					bodies.push(c);
			}
			
			return bodies;
		}
		
		function get_first_row()
		{
			var source = get_bodies()[0] || table;
			
			for (var c = source.firstChild; c; c = c.nextSibling) {
				if (Util.Node.is_tag(c, 'TR'))
					return c;
			}
			
			return null;
		}
		
		function promote_row(row, where)
		{
			var method = 'createT' + where[0].toUpperCase() + where.substr(1);
			var dest = table[method]();
			
			if (!row)
				return false;
			
			dest.insertBefore(row, dest.firstChild);
			return true;
		}
		
		function is_header_row(row) {
			var maybe = false;
			
			for (var c = row.firstChild; c; c = c.nextSibling) {
				if (Util.Node.is_tag(c, 'TD'))
					return false;
				if (!maybe && Util.Node.is_tag(c, 'TH'))
					maybe = true;
			}
			
			return maybe;
		}
		
		function count_columns(row) {
			var count = 0;
			
			for (var c = row.firstChild; c; c = c.nextSibling) {
				if (Util.Node.is_tag(c, 'TD') || Util.Node.is_tag(c, 'TH'))
					count++;
			}
			
			return count;
		}
		
		function create_header_row(cells) {
			var row = table.ownerDocument.createElement('TR');
			
			for (var i = 0; i < cells; i++) {
				row.appendChild(row.ownerDocument.createElement('TH'));
			}
			
			return row;
		}
		
		function fill_in_empty_cells(row)
		{
			var empty_pat = /^(\s|&nbsp;|<br[^>]*>)+$/i;
			
			for (var c = row.firstChild; c; c = c.nextSibling) {
				if (!Util.Node.is_tag(c, 'TD') && !Util.Node.is_tag(c, 'TH'))
					continue;
				
				if (!c.hasChildNodes() || empty_pat.test(c.innerHTML))
					c.innerHTML = empty_header_text;
			}
		}
		
		if (!Util.Node.is_tag(table, 'TABLE')) {
			throw new TypeError("Cannot normalize the table structure of a " +
				"non-table.");
		}
		
		if (first_row_is_head) {
			promote_row(get_first_row(), 'head');
		}
		
		var head = table.createTHead();
		var head_valid = true;
		if (head.getElementsByTagName("TR").length == 0) {
			// See if the first row of the table is actually a header row.
			var candidate = get_first_row();
			if (is_header_row(candidate)) {
				promote_row(candidate, 'head');
			} else {
				head_valid = false; // don't worry about the lack of header
				/*
				// Create an empty header row.
				var hr = create_header_row(count_columns(candidate));
				head.appendChild(hr);
				*/
			}
		}
		
		var bodies = get_bodies();
		if (bodies.length == 0) {
			var body = table.ownerDocument.createElement('TBODY');
			head.parentNode.insertBefore(body, head.nextSibling);
			
			for (var c = table.firstChild; c; c = c.nextSibling) {
				if (Util.Node.is_tag(c, 'TR'))
					body.appendChild(c);
			}
		}
		
		if (!head_valid) {
			table.deleteTHead();
		} else {
			for (var c = head.firstChild; c; c = c.nextSibling) {
				if (Util.Node.is_tag(c, 'TR'))
					fill_in_empty_cells(c);
			}
		}
		
		return table;
	}
	
	this.massage_node_descendants =
		function massage_table_node_descendants(node)
	{
		var tables = node.getElementsByTagName('TABLE');
		if (!tables.length)
			return;
		
		for (var i = tables.length - 1; i >= 0; i--) {
			massage_table(tables[i]);
		}
	}
	
	this.unmassage_node_descendants =
		function unmassage_table_node_descendants(node)
	{
		var tables = node.getElementsByTagName('TABLE');
		if (!tables.length)
			return;
		
		for (var i = tables.length - 1; i >= 0; i--) {
			unmassage_table(tables[i]);
		}
	}
	
	function massage_table(table)
	{	
		if (!table.getAttribute('border'))
			Util.Element.add_class(table, 'loki__borderless_table');
		
		// Add trailing <br /> in Gecko, for better display and editing
		if (Util.Browser.Gecko) {
			// First, try innerHTML
			var h;
			if (table.innerHTML != null && table.innerHTML != '')
			{
				h = table.innerHTML;
				h.replace( new RegExp('(<td[ ]?[^>]*>)[ ]*(</td>)', 'gi'), '$1<br />$2' );
				h.replace( new RegExp('(<th[ ]?[^>]*>)[ ]*(</th>)', 'gi'), '$1<br />$2' );
				table.innerHTML = h;
			}
			// But sometimes (namely, when the table is first created in Gecko), 
			// innerHTML is mysteriously not available. In that case, we use the
			// slower DOM method, which on large tables can cause Gecko to display
			// the "Something is causing this script to run slowly; do you want to 
			// kill it?" alert:
			for ( var i = 0; i < table.rows.length; i++ )
			{
				var row = table.rows[i];
				for ( var j = 0; j < row.cells.length; j++ )
				{
					var cell = row.cells[j];
					if ( !( cell.lastChild != null &&
						    cell.lastChild.nodeType == Util.Node.ELEMENT_NODE &&
						    cell.lastChild.tagName == 'BR' ) )
					{
						cell.appendChild( cell.ownerDocument.createElement('BR') );
					}
				}
			}
		}
		
		normalize_table_structure(table, false);
	}
	
	function unmassage_table(table)
	{
		Util.Element.remove_class(table, 'loki__borderless_table');
		
		// Remove trailing <br /> in Gecko
		if (Util.Browser.Gecko) {
			var h = table.innerHTML;
			h.replace(/<br\s*\/?>(<\/t[dh]>)/gi, '$1');
			table.innerHTML = h;

			/*
			for ( var i = 0; i < table.rows.length; i++ )
			{
				var row = table.rows[i];
				for ( var j = 0; j < row.cells.length; j++ )
				{
					var cell = row.cells[j];
					if ( cell.lastChild != null &&
						 cell.lastChild.nodeType == Util.Node.ELEMENT_NODE &&
						 cell.lastChild.tagName == 'BR' )
					{
						cell.removeChild(cell.lastChild);
					}
				}
			}
			*/
		}
	}
	
	this.massage_elem = massage_table;
	this.unmassage_elem = unmassage_table;
};
