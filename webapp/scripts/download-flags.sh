#!/usr/bin/env bash
download_flag() {
    file=${1}.svg
    mkdir "$(dirname "${file}")" 2>/dev/null
    wget -qO "${file}" -- "http://flags.ox3.in/svg/${file}"
    if [ $? -ne 0 ]; then echo "Error: not found: ${file}."; return 1;
    echo "Flag ${file} downloaded"; fi
}

download_flags() {
    echo "Download flags for countries"
    echo "Read county ids or state ids from the stdin"
    while read id; do
        echo "Processing ${id}..."
        download_flag "${id}"
    done
}

# Create 'img' subdirectory in the static section of the site
cd $(dirname "${0}")/..
output_dir=./build/static/img/
mkdir -p "${output_dir}" 2>/dev/null
cd "${output_dir}"

# Parse all states from the states.csv file and download flags for them
echo "Working diretory ${PWD}"
(cat "../../../../data/covid-database/init/data-us-states.csv" | awk -F',' '{print "us/"tolower($1)}' | sort -u;
 echo "us") | download_flags
