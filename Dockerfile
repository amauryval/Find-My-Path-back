FROM continuumio/miniconda3 AS build

WORKDIR /usr/src/

COPY environment.yml environment.yml
RUN conda install -c conda-forge mamba conda-pack

RUN mamba env create -f environment.yml
RUN conda clean --all --yes

# Use conda-pack to create a standalone enviornment
# in /venv:
RUN conda-pack -n findmypath -o /tmp/env.tar && \
  mkdir /venv && cd /venv && tar xf /tmp/env.tar && \
  rm /tmp/env.tar

# We've put venv in same path it'll be in final image,
# so now fix up paths:
RUN /venv/bin/conda-unpack



FROM debian:latest AS runtime

# install graphtool
RUN apt-get update && apt install libgtk-3-0 -y
 #libgtk-3-dev -y

COPY app.py app.py
COPY /findmypath findmypath/

# Copy /venv from the previous stage:
COPY --from=build /venv /venv

# no root user
RUN useradd --no-create-home ava
RUN chown -R ava:ava /venv/lib/python3.8/site-packages/osmgt/geometry/

RUN mkdir /tmp/matplotlib
ENV MPLCONFIGDIR=/tmp/matplotlib
RUN chown -R ava:ava $MPLCONFIGDIR
USER ava


# When image is run, run the code with the environment
# activated:
SHELL ["/bin/bash", "-c"]

ENTRYPOINT source /venv/bin/activate && \
           gunicorn -b 0.0.0.0:5001 app:app

