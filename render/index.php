<?php

header("Content-Type: image/jpeg");
passthru("phantomjs renderer.js");
