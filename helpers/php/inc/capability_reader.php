<?php

/**
 * @ignore
 */
class Loki2Capabilities
{
	var $capabilities = array();
	var $sets = array();
	
	function read($js_path)
	{
		$cf = fopen($js_path.'UI.Capabilities.js', 'r');
		if (!$cf) {
			user_error('Failed to open the Loki capabilities file.',
				E_USER_WARNING);
			return false;
		}
		
		$state = 0;
		$capability_classes = array();
		$sets_lines = array();
		
		static $cap =
			'@\w+\.add\(([\'"])(\w+)\1\s*,\s*([^)]+)\)@S';
		
		$other_thing = null;
		
		while ($line = fgets($cf)) {
			$m = array();
			
			switch ($state) {
				case 0:
					// looking for a magic section
					
					if ($b = $this->_is_boundary($line)) {
						if ($b[0] != 'BEGIN') {
							// END before BEGIN? eek.
							user_error('The Loki 2 capabilities file seems to '.
								'be invalid: END before BEGIN.',
								E_USER_WARNING);
							@fclose($cf);
							return false;
						}
						
						switch ($b[1]) {
							case 'CAPABILITIES':
								$state = 1;
								break;
							case 'SETS':
								$state = 2;
								break;
							default:
								$other_thing = $b[1];
								$state = 3;
						}
					}

					break;
				
				case 1:
					if (!preg_match($cap, $line, $m)) {
						if ($b = $this->_is_boundary($line)) {
							if ($b[0] == 'BEGIN') {
								// BEGIN after a BEGIN without an END?!
								user_error('The Loki 2 capabilities file seems'.
									' invalid: BEGIN after BEGIN without END.',
									E_USER_WARNING);
								@fclose($cf);
								return false;
							} else if ($b[1] != 'CAPABILITIES') {
								user_error('The Loki 2 capabilities file seems'.
									' invalid: BEGIN/END mismatch.',
									E_USER_WARNING);
								@fclose($cf);
								return false;
							}
							
							$state = 0;
							break;
						}
					}
					
					$capability_classes[$m[2]] = $m[3];
					break;
				
				case 2:
					if (!preg_match($cap, $line, $m)) {
						if ($b = $this->_is_boundary($line)) {
							if ($b[0] == 'BEGIN') {
								// BEGIN after a BEGIN without an END?!
								user_error('The Loki 2 capabilities file seems'.
									' invalid: BEGIN after BEGIN without END.',
									E_USER_WARNING);
								@fclose($cf);
								return false;
							} else if ($b[1] != 'SETS') {
								user_error('The Loki 2 capabilities file seems'.
									' invalid: BEGIN/END mismatch.',
									E_USER_WARNING);
								@fclose($cf);
								return false;
							}
							
							$this->_parse_sets(implode("", $sets_lines));
							$sets_lines = array();
							$state = 0;
							break;
						}
					}
					
					$sets_lines[] = $line;
					break;
				case 3:
					if ($b = $this->_is_boundary($line)) {
						if ($b[0] == 'BEGIN') {
							// BEGIN after a BEGIN without an END?!
							user_error('The Loki 2 capabilities file seems'.
								' invalid: BEGIN after BEGIN without END.',
								E_USER_WARNING);
							@fclose($cf);
							return false;
						} else if ($b[1] != $other_thing) {
							user_error('The Loki 2 capabilities file seems'.
								' invalid: BEGIN/END mismatch.',
								E_USER_WARNING);
							@fclose($cf);
							return false;
						}
						
						$state = 0;
					}
					
					break;
			}
		}
		
		@fclose($cf);
		
		$this->_get_capability_descriptions($js_path, $capability_classes);
		
		return true;
	}
	
	function _get_capability_descriptions($js_path, $capability_classes)
	{
		static $pattern =
			'@Util.OOP.inherits\(\w+,\s*UI.Capability,\s*\w+,\s*([\'"])(.+)\1\)@S';
				
		$sl = DIRECTORY_SEPARATOR;
		
		foreach ($capability_classes as $sel => $class) {
			$sf = fopen($js_path.$sl.$class.'.js', 'r');
			if ($sf) {
				$m = array();
				while ($line = fgets($sf)) {
					if (preg_match($pattern, $line, $m)) {
						$this->capabilities[$sel] = $m[2];
						@fclose($sf);
						continue 2;
					}
				}
			}
			
			$this->capabilities[$sel] = '('.ucfirst($sel).')';	
		}
	}
	
	function _parse_sets($sets)
	{
		static $pattern =
			'@\w+\.put_set\(([\'"])(\w+)\1,\s*\[([^\]]+)\]\s*\)@';
		
		$m = array();
		$n = preg_match_all($pattern, $sets, $m, PREG_SET_ORDER);
		
		for ($i = 0; $i < $n; $i++) {
			$name = $m[$i][2];
			
			$caps = array();
			if ($cc = preg_match_all('@([\'"])(\w+)\1@', $m[$i][3], $caps)) {
				$this->sets[$name] = $caps[2];
			}
		}
	}
	
	function _is_boundary($line)
	{
		static $magic =
			'@//\s*(-+)\s*(BEGIN|END) BUNDLED (CAPABILITIES|SETS)\s*\1\s*$@S';
		
		$m = array();
		if (!preg_match($magic, $line, $m))
			return false;
		
		return array($m[2], $m[3]);
	}
	
	function _is_beginning($line)
	{
		if (!$b = $this->_is_boundary($line))
			return false;
		
		if ($b[0] == 'end') {
			user_error('The Loki 2 capabilities file seems to '.
				'be invalid: END before BEGIN.',
				E_USER_WARNING);
			return false;
		}
		
		
	}
	
	
}

?>