<?php

if (!defined('DIRECTORY_SEPARATOR'))
	define('DIRECTORY_SEPARATOR', '/');

if (!defined('LOKI_2_PHP_INC')) {
	define('LOKI_2_PHP_INC', dirname(__FILE__).DIRECTORY_SEPARATOR.
		'inc'.DIRECTORY_SEPARATOR);
}

if (!defined('LOKI_2_PATH')) {
	if (defined('LOKI_2_INC')) {
		// old constant name
		define('LOKI_2_PATH', LOKI_2_INC);
	} else {
		Loki2::_guess_path();
	}
}

/**
 * Second generation of the Loki XHTML editor
 *
 * Takes care of building the (x)html to instantiate Loki
 * 
 * <strong>Minimal Usage:</strong>
 * <code>
 * $widgets = array('em','strong','ulist'); // or $widgets = 'all'; or $widgets = 'default'; etc.
 * $loki = new Loki2( 'field_name', 'field_value' );
 * $loki->print_form_children();
 * </code>
 *
 * <strong>More sophisticated usage:</strong>
 * <code>
 * $widgets = array('em','strong','ulist');
 * $admin = true; // for code editing
 * $loki = new Loki2( 'field_name', 'field_value', $widgets, $admin );
 * $loki->print_form_children();
 * </code>
 *
 * <strong>Very sophisticated usage -- integrated into a content management system:</strong>
 * <code>
 * $widgets = array('em','strong','ulist');
 * $admin = true; // for code editing
 * $paths = array('image_feed'=>'http://foo.com','site_feed'=>'http://bar.net','finder'=>'http://baz.edu','default_site_regexp'=>'http:\/\/foofoo.org\/','
 * $loki = new Loki2( 'field_name', 'field_value', $widgets, $admin );
 *
 * // see Loki's integration documentation for an explanation of the values in this area
 * $loki->set_feed('images','http://foo.com/image_feed.xml');
 * $loki->set_feed('sites','http://bar.net/site_feed.xml');
 * $loki->set_feed('finder','http://baz.edu/feed_finder.xml');
 * $loki->set_default_site_regexp('http:\/\/foofoo.org\/');
 * $loki->set_default_type_regexp('http:\/\/barbar.org\/');
 *
 * $loki->print_form_children();
 * </code>
 */
class Loki2
{
	var $_asset_path;
	var $_current_options = 'default';

	var $_field_name;
	var $_field_value;
	var $_editor_id;
	var $_editor_obj;
	var $_user_is_admin;
	var $_feeds = array();
	var $_styles = null;
	var $_default_site_regexp = '';
	var $_default_type_regexp = '';
	var $_sanitize_unsecured = false;
	var $_monopolize_clipboard = false;
	var $_allowable_tags = null;
	var $_external_script_path = null;
	var $_document_style_sheets = array();

	/**
	 * Constructor
	 *
	 * @param	string	$field_name		  How Loki is identified within its containing form. This will become the name of the textarea that Loki creates
	 *                                    and therefore of the request variable received by the form's action.
	 * @param   string  $field_value      The HTML that Loki will initially be editing.
	 * @param	string	$current_options  Indicates which buttons etc Loki should present to the user. For the possible values, see js/UI.Loki_Options.js
	 * @param	boolean	$user_is_admin	  Whether the user is an administrator. Administrators can get options normal users can't.
	 */
	function Loki2( $field_name, $field_value = '', $current_options = 'default', $user_is_admin = false, $debug = false )
	{
		if (!defined('LOKI_2_HTTP_PATH')) {
			trigger_error('The constant LOKI_2_HTTP_PATH must be defined '.
				'in order to instantiate a copy of the Loki2 editor.',
				E_USER_ERROR);
		}
		
		$this->_asset_protocol = strpos($_SERVER['SCRIPT_URI'], 'https') === 0
			? 'https://'
			: 'http://';
		$this->_asset_host = $_SERVER['HTTP_HOST'];
		$this->_asset_path = ('/' != substr(LOKI_2_HTTP_PATH, -1, 1))
			? LOKI_2_HTTP_PATH.'/'
			: LOKI_2_HTTP_PATH;
		$this->_asset_uri = $this->_asset_protocol . $this->_asset_host . $this->_asset_path;
		$this->_asset_file_path = LOKI_2_PATH;
		$this->_current_options = $current_options;

		$this->_field_name = $field_name;
		$this->_set_field_value($field_value);
		$this->_editor_id = uniqid('loki');
		$this->_editor_obj = $this->_editor_id."_obj";
		$this->_user_is_admin = $user_is_admin;
        $this->_debug = $debug;
	}

	/**
	 * Sets the given feed.
	 *
	 * @param	string	$feed_name	The name of the feed.
	 * @param	string	$feed_url	The url of the feed.
	 */
	function set_feed($feed_name, $feed_url)
	{
		$this->_feeds[$feed_name] = $feed_url;
	}
	
	/**
	 * Sets the included paragraph styles.
	 * @param	string	$selector	Paragraph style selector string
	 * @return void
	 */
	function set_styles($selector)
	{
		$this->_styles = $selector;
	}

	/**
	 * Sets the regular expression used by the link dialog to determine which site 
	 * to display as default when no link is selected.
	 *
	 * @param	string	$regexp	The _Javascript_ regexp. You might want to use 
	 *                          {@link js_regexp_quote()} to make things easier.
	 */
	function set_default_site_regexp($regexp)
	{
		$this->_default_site_regexp = $regexp;
	}

	/**
	 * Sets the regular expression used by the link dialog to determine which type 
	 * to display as default when no link is selected.
	 *
	 * @param	string	$regexp	The _Javascript_ regexp. You might want to use 
	 *                          {@link js_regexp_quote()} to make things easier.
	 */
	function set_default_type_regexp($regexp)
	{
		$this->_default_type_regexp = $regexp;
	}
	
	/**
	 * Sets whether or not Loki will sanitize embedded content the transmission
	 * of which is not SSL-secured by not displaying it in the editor.
	 * @param bool $value true to perform the sanitization, false if otherwise
	 * @return void
	 */
	function sanitize_unsecured($value)
	{
		$this->_sanitize_unsecured = (bool) $value;
	}
	
	/**
	 * Sets whether or not Loki will block any attempts by the user to cut,
	 * copy, or paste using the browser and instead force him or her to go
	 * through Loki, so that Loki will be able to perform all needed cleanups.
	 * @param bool $value true to monopolize the clipboard as such, false if no
	 * @return void
	 */
	function monopolize_clipboard($value)
	{
		$this->_monopolize_clipboard = (bool) $value;
	}
	
	/**
	 * Adds style sheets to the editing document.
	 * @param mixed $path either the path to a CSS file to include, or an array
	 * of them
	 * @return void
	 */
	function add_document_style_sheets($path)
	{
		$paths = func_get_args();
		
		foreach ($paths as $path) {
			$this->_document_style_sheets[] = $path;
		}
	}

	/**
	 * Prints the html which needs to be placed within a form.
	 */
	function print_form_children()
	{
		$this->include_js();
		
		$options_str = (is_array($this->_current_options))
			? implode(' ', $this->_current_options)
			: $this->_current_options;
		
		// Source view is available if and only if the user is an administrator.
		if ($this->_user_is_admin)
			$options_str .= ' +source';
			
		$textarea_id = 'loki__'.$this->_field_name.'__textarea';
		?>
		
		<script type="text/javascript">
			(function init_<?= $this->_editor_id ?>() {
				var created = false;
				
				function create_editor()
				{
					if (created)
						return;
					created = true;
					
					var settings = {
						base_uri : '<?php echo $this->_asset_path; ?>',
						<?php $this->_feed('images') ?>
						<?php $this->_feed('sites') ?>
						<?php $this->_feed('finder') ?>
						default_site_regexp : new RegExp('<?php echo $this->_default_site_regexp; ?>'),
						default_type_regexp : new RegExp('<?php echo $this->_default_type_regexp; ?>'),
						use_xhtml : true,
						<?php $this->_bool_param('sanitize_unsecured') ?>
						<?php $this->_bool_param('monopolize_clipboard') ?>
						<?php $this->_o_param('styles') ?>
						<?php $this->_o_param('document_style_sheets') ?>
						capabilities : <?php echo $this->_js_translate($options_str) ?>,
						<?php $this->_o_param('allowable_tags', true) ?>

					};
					
					var loki = new UI.Loki(settings);
					loki.replace_textarea(document.getElementById('<?php echo $textarea_id ?>'));
				}
				
				function report_error(message)
				{
					var exc = arguments[1] || null;
					
					if (console && console.error) {
						if (exc)
							console.error(message, exc);
						else
							console.error(message);
					} else {
						if (exc)
							alert(message + "\n\n" + exc);
						else
							alert(message);
					}
				}
				
				try {
					if (window.addEventListener) {
						document.addEventListener('DOMContentLoaded', create_editor, true);
						window.addEventListener('load', create_editor, false);
					} else if (window.attachEvent) {
						window.attachEvent('onload', create_editor);
					} else {
						var message = 'Failed to create the Loki editor for <?= $this->_field_name ?>: no available method for trapping load completion.';
						report_error(message);
					}
				} catch (e) {
					report_error('Failed to listen for window load.', e);
				}
				
			})();
		</script>

		<?php // we htmlspecialchars because Mozilla converts all greater and less than signs in the textarea to entities, but doesn't convert amperstands to entities. When the value of the textarea is copied into the iframe, these entities are resolved, so as to create tags ... but then so are greater and less than signs that were originally entity'd. This is not desirable, and in particular allows people to add their own HTML tags, which is bad bad bad. ?>
		<textarea name="<?php echo $this->_field_name; ?>" rows="20" cols="80" id="<?php echo $textarea_id; ?>"><?php echo htmlentities($this->_field_value, ENT_QUOTES, 'UTF-8'); ?></textarea>
		<?php

	}
	
	/**
	 * Include all JavaScript files.
	 *
	 * NOTE: This function will only run once per page generation so as not to bloat the page.
	 * it is important to make sure method contains only the hooks to the general Loki 
	 * libraries, and nothing else, because a single block of javascript is used for all Loki 
	 * instances on a page.
	 *
	 * NOTE: static vars in a method are shared by all objects in PHP
	 * we are depending on this fact to make sure that only the first Loki object spits 
	 * out the Loki js.
	 *
	 * @param	mode	Defaults to 'static', which uses the prebuilt script
	 *                  file that ships with Loki. Other modes are only useful
	 *                  for Loki testing and only work when paired with a
	 *                  source distribution or Subversion checkout of Loki.
	 * @param	path	For the 'external' mode, specifies the HTTP path to the
	 *					Loki script aggregator. If this is not specified,
	 *					the path will be guessed based on the default Loki
	 *					directory layout.
	 */
	function include_js($mode=null, $path=null)
	{
		static $loki_js_has_been_included = false;
		
		if(!$loki_js_has_been_included)
		{
			// Set up hidden iframe for clipboard operations
			$priv_jar = 'jar:'.$this->_asset_protocol.$this->_asset_host.
				$this->_asset_path.'auxil/privileged.jar!/gecko_clipboard.html';
			
			?>
			<script type="text/javascript">
				var _gecko_clipboard_helper_src = '<?php echo $priv_jar ?>';
				UI__Clipboard_Helper_Editable_Iframe__src = '<?php echo $this->_asset_protocol . $this->_asset_host . $this->_asset_path; ?>auxil/loki_blank.html';
			</script>
			<?php
			
			$mode = ($mode) ? strtolower($mode) : 'static';
			
			if ($mode == 'static') {
				if (!$path) {
					$path = $this->_asset_path.'loki.js';
				}
				
				echo '<script type="text/javascript" language="javascript" src="'.$path.'">',
					"</script>\n";
			} else if ($mode == 'debug') {
				$files = $this->_get_js_files();
				$base = $this->_asset_path.'js';
				if (!$files)
					return false;
				
				foreach ($files as $filename) {
					echo '<script type="text/javascript" '.
						'src="'.$base.$filename.'" charset="utf-8"></script>';
				}
			} else if ($mode == 'external') {
				if (!$path) {
					$path = $this->_asset_path.
						'helpers/php/loki_editor_scripts.php';
				}
				
				echo '<script type="text/javascript" language="javascript" src="'.$path.'">',
					"</script>\n";
			} else if ($mode == 'inline') {
				$files = $this->_get_js_files();
				$base = $this->_asset_file_path.'js';
				if (!$files)
					return false;
				
				echo '<script type="text/javascript">', "\n";
				foreach ($files as $filename) {
					echo "\n// file $file \n\n";
					readfile($base.$filename);
				}
			} else {
				user_error('Unknown Loki JS inclusion mode "'.$mode.'". '.
					'Cannot load Loki\'s JavaScript.', E_USER_WARNING);
				return false;
			}
			
			$loki_js_has_been_included = true;
		}
		
		return true;
	}
	
	/**
	 * Returns the capabilities and sets of capabilities that are bundled with
	 * Loki.
	 *
	 * {
	 *      'capabilities' => array('[selector]' => '[description]', ...),
	 *		'sets' => array('[selector]' => array('[cap. selector]', ...), ...)
	 * }
	 *
	 * @return object	the capabilities and sets
	 * @static
	 */
	function get_capabilities()
	{
		static $capabilities = null;
		
		if (!$capabilities) {
			require_once LOKI_2_PHP_INC.'capability_reader.php';
			$c = new Loki2Capabilities();
			
			if (!$c->read(LOKI_2_PATH.'js'.DIRECTORY_SEPARATOR))
				return false;
			
			$capabilities = $c;
		}
		
		return $capabilities;
	}

	/**
	 * Quotes a javascript regular expression.
	 *
	 * @param	string	$s	The unquoted regexp.
	 * @return	string		The quoted regexp.
	 */
	function js_regexp_quote($s)
	{
		$specials_pat = '/(\/|\.|\*|\+|\?|\||\(|\)|\[|\]|\{|\}|\\\\)/';
		// first two \\\\ are for one \ each in the ultimate javascript code,
		// and the ending \1 is a backreference:
		return preg_replace($specials_pat, '\\\\\\\\\1', $s);
	}

	/**
	 * Gets the field's value.
	 * @return  string  The value of the Loki-ized field (before being edited).
	 */
	function get_field_value()
	{ 
		return $this->_field_value; 
	}

	/**
	 * Sets the field's value.
	 * @param  string  $field_value  The value of the Loki-ized field (before being edited).
	 */
	function _set_field_value($field_value) 
	{
		$this->_field_value = $field_value;
	}
	
	function _get_js_files($source=null)
	{
		if (!$source)
			$source = $this->_asset_file_path.'js';
		
		require_once LOKI_2_PHP_INC.'js_filenames.php';
		$finder = new Loki2ScriptFinder($source);
		return $finder->files;
	}
	
	/**
	 * Sets the list of HTML tags allowed to exist in Loki output.
	 * @param array $tags
	 * @return void
	 */
	function set_allowable_tags($tags)
	{
		$this->_allowable_tags = $tags;
	}
	
	/**
	 * @static
	 * @return void
	 */
	function _guess_path()
	{
		$php_helper = dirname(__FILE__);
		if (basename($php_helper) == 'php') {
			$helpers = dirname($php_helper);
			if (basename($helpers) == 'helpers') {
				define('LOKI_2_PATH', dirname($helpers).DIRECTORY_SEPARATOR);
				return;
			}
		}
		
		user_error('Cannot automatically determine the path to Loki 2; please '.
			'define the LOKI_2_PATH constant.', E_USER_ERROR);
	}
	
	function _bool_param($which, $last=false)
	{
		$var = '_'.$which;
		$value = $this->$var;
		
		echo $which.' : '.(($value) ? 'true' : 'false');
		
		if (!$last)
			echo ',';
		echo "\n";
	}
	
	function _o_param($which, $last=false)
	{
		$var = '_'.$which;
		
		if (!empty($this->$var)) {
			echo $which.' : ', Loki2::_js_translate($this->$var);
			if (!$last)
				echo ',';
		}
		echo "\n";
	}
	
	function _feed($which, $last=false)
	{
		if (!empty($this->_feeds[$which])) {
			echo $which, '_feed : ',
				Loki2::_js_translate($this->_feeds[$which]);
			if (!$last)
				echo ',';
		}
		echo "\n";
	}
	
	function _js_translate($item)
	{
		if (is_scalar($item)) {
			if (is_string($item)) {
				return '"'.addslashes($item).'"';
			} else if (is_numeric($item)) {
				return $item;
			} else if (is_bool($item)) {
				return ($item) ? 'true' : 'false';
			} else {
				trigger_error('Unknown scalar type "'.gettype($item).'".',
					E_USER_WARNING);
				return 'undefined';
			}
		} else {
			if (is_null($item)) {
				return 'null';
			} else if (is_array($item)) {
				return '['.implode(', ',
					array_map(array('Loki2', '_js_translate'), $item)).']';
			} else if (is_object($item)) {
				$repr = '{';
				$first = true;
				foreach ((array) $item as $k => $v) {
					if ($first)
						$first = false;
					else
						$repr .= ', ';
					
					$repr .= "'".addslashes($k)."': ".Loki2::_js_translate($v);
				}
				$repr .= '}';
				return $repr;
			} else {
				trigger_error('Unknown non-scalar type "'.gettype($item).'".',
					E_USER_WARNING);
				return 'undefined';
			}
		}
		
	}
}
?>