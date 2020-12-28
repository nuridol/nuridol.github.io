#!/bin/bash

#!/bin/bash

function auto_commit {
    target_dir="$1"
    (
    if [ -d "${target_dir}" ]; then
        echo "Auto commit: ${target_dir}"
        cd "${target_dir}"
        /usr/local/bin/git add .
        /usr/local/bin/git commit -a -m "auto commit $(/bin/date +%F-%T)"
        /usr/local/bin/git push
        echo "DONE!"
    fi
    )
}

# run auto commit
auto_commit "./"
