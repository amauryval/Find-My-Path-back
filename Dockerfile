FROM continuumio/miniconda3

# install graphtool
RUN apt-get update
RUN apt install libgtk-3-0 libgtk-3-dev -y

WORKDIR /usr/src/

COPY environment.yml environment.yml
RUN conda install -c conda-forge mamba
RUN mamba env create -f environment.yml
RUN conda clean --all --yes

COPY app.py app.py
COPY /findmypath findmypath/

# no root user
RUN useradd --no-create-home ava
RUN chown -R ava:ava /opt/conda/envs/findmypath/
USER ava

ENTRYPOINT [ "conda", "run", "-n", "findmypath", "gunicorn", "-b", "0.0.0.0:5001", "app:app"]