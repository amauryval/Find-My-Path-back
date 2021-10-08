FROM continuumio/miniconda3

# install graphtool
RUN apt-get update
RUN apt install libgtk-3-0 libgtk-3-dev -y

WORKDIR /usr/src/
RUN ls
COPY environment.yml environment.yml
RUN conda install -c conda-forge mamba
RUN mamba env create -f environment.yml

COPY app.py app.py
COPY /findmypath findmypath/

# RUN conda env update --name base --file environment.yml --prune
RUN conda clean -a

ENTRYPOINT [ "conda", "run", "-n", "findmypath", "gunicorn", "-b", "0.0.0.0:5001", "app:app"]