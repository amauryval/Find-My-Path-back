FROM mambaorg/micromamba:0.15.3

USER root
# install graphtool
RUN apt-get update
RUN apt install libgtk-3-0 libgtk-3-dev -y

USER micromamba
WORKDIR /usr/src/
RUN ls
COPY environment.yml environment.yml
RUN micromamba env create -f environment.yml

COPY app.py app.py
COPY /findmypath findmypath/

# RUN conda env update --name base --file environment.yml --prune
RUN micromamba clean -a


ENTRYPOINT [ "micromamba", "run", "-n", "findmypath", "gunicorn", "-b", "0.0.0.0:5001", "app:app"]