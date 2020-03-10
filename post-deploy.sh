
#! /bin/bash

# Extract the project name from the arguments
while getopts "p:" opt; do
	case ${opt} in
		p )
			PROJECT_NAME=${OPTARG}
			;;
	esac
done


# -/-/-/-/-
# Set up the environment directory
# -/-/-/-/-
# Re-establish the symbolic link
unlink environment
mkdir -p ../environment/${PROJECT_NAME}
ln -s ../environment/${PROJECT_NAME} environment
# Initialize the "scheduled-tasks" and "logs" directories if they aren't already present
mkdir -p environment/scheduled-tasks
mkdir -p environment/logs


# -/-/-/-/-
# Initialize the nodeJS environment
# -/-/-/-/-
[ -s "/root/.nvm/nvm.sh" ] && \. "/root/.nvm/nvm.sh"



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
	PROJECT_DIR="`pwd`"
	SERVICES_DIR="$PROJECT_DIR/services"
	LOG_DIR="$PROJECT_DIR/environment/logs"
	# ENV_PATH="${TASKS_DIR}:/usr/local/bin:/usr/bin:/bin"
	# ENV_HOME="${LOG_DIR}"
	# CRONTAB_ENV_VARS="\n\n${ENV_PATH}\nHOME=${ENV_HOME}\n";
	CRONTAB_ENV_VARS="\nSERVICES_DIR=${SERVICES_DIR}\nLOG_DIR=${LOG_DIR}\n";
	find -type f -name '*.crontab' -exec cat {} \; > tmp_crontab;
	printf $CRONTAB_ENV_VARS | cat - tmp_crontab | tee tmp_2_crontab;
	rm tmp_crontab;

	# Copy the consolidated scheduled tasks file to the environment
	mv tmp_2_crontab environment/scheduled-tasks/$PROJECT_NAME.crontab
	# Re-establish all the scheduled tasks for the entire system
	cat environment/scheduled-tasks/*.crontab | crontab -
fi
