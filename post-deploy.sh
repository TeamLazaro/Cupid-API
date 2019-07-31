
#! /bin/bash

while getopts "p:" opt; do
	case ${opt} in
		p )
			PROJECT_DIR=${OPTARG}
			;;
	esac
done

# Establish a symbolic link for the environment directory:
rm environment
mkdir -p ../environment/${PROJECT_DIR}
ln -s ../environment/${PROJECT_DIR} environment

# -/-/-/-/-
# Install the third-party packages
# -/-/-/-/-
npm install

# -/-/-/-/-
# Reload the node processes
# -/-/-/-/-
pm2 reload "cupid"

# -/-/-/-/-
# Set up all the scheduled tasks
# -/-/-/-/-
if [ -f setup/tasks.crontab ]; then
	# Set permissive permissions for the scheduled task scripts
	# chmod 744 */scheduled-tasks/*
	chmod 744 services/*
	# Build a cumulative, consolidated crontab
	TASKS_DIR="`pwd`/services"
	LOG_DIR="`pwd`/environment/logs"
	CRON_ENV="\n\nPATH=/bin:/usr/bin:/usr/local/bin:${TASKS_DIR}\nHOME=${LOG_DIR}\n";
	find -type f -name '*.crontab' -exec cat {} \; > tmp_crontab;
	printf $CRON_ENV | cat - tmp_crontab | tee tmp_2_crontab;
	rm tmp_crontab;

	# Copy the consolidated scheduled tasks file to the environment
	mv tmp_2_crontab environment/scheduled-tasks/$PROJECT_DIR.crontab
	# Re-establish all the scheduled tasks for the entire system
	cat environment/scheduled-tasks/*.crontab | crontab -
fi
