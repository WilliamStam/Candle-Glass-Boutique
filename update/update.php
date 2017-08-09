<?php
class update {
	function __construct($cfg){


	}
	public static function code($cfg,$alreadyRun=false){
		$root_folder = dirname(dirname(__FILE__));


		chdir($root_folder);
		$return = "";
		if (!file_exists($root_folder."\\.git")) {
			shell_exec('git init');
		} else {

			//shell_exec('git stash');
			shell_exec('git reset --hard HEAD');
		}



		$output = shell_exec('git pull https://'.$cfg['git']['username'] .':'.$cfg['git']['password'] .'@'.$cfg['git']['path'] .' ' . $cfg['git']['branch'] . ' 2>&1');


		if (strpos($output, "Please move or remove them before you can merge.") && $alreadyRun != true) {
			shell_exec('git stash');
			self::code($cfg, true);
		}

		
	//	$str = str_replace(".git","",$cfg['git']['path']);
	//	$output = str_replace("From $str","", $output);
		$output = str_replace("* branch            ". $cfg['git']['branch'] ."     -> FETCH_HEAD","", $output);
		$output .= "</hr>\n\n";
		
		
		

		return $return;
	}

}
