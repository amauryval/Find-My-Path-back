FROM condaforge/mambaforge:4.14.0-0 AS build

# WORKDIR /usr/src/
#

COPY environment.yml environment.yml




#
RUN mamba env create --prefix /tmp/env -f environment.yml \
    && conda clean --all --yes
# RUN find /opt/conda/ -follow -type f -name '*.a' -delete \
#     && find /opt/conda/ -follow -type f -name '*.pyc' -delete \
#     && find /opt/conda/ -follow -type f -name '*.js.map' -delete
#     # && find /opt/conda/lib/python*/site-packages/bokeh/server/static -follow -type f -name '*.js' ! -name '*.min.js' -delete

# Use conda-pack to create a standalone enviornment
# in /venv:
# RUN conda-pack --ignore-missing-files -n findmypath -o /tmp/env.tar && \
#   mkdir /venv && cd /venv && tar xf /tmp/env.tar && \
#   rm /tmp/env.tar

# We've put venv in same path it'll be in final image,
# so now fix up paths:
# RUN /venv/bin/conda-unpack

FROM debian:stable-slim AS runtime

# install graphtool
RUN apt-get update && apt install libgtk-3-0 -y
 #libgtk-3-dev -y

# Copy /venv from the previous stage:
COPY --from=build /tmp/env /env


COPY app.py app.py
COPY /findmypath findmypath/

# no root user
RUN useradd --no-create-home ava
RUN chown -R ava:ava /env/lib/python3.9/site-packages/osmgt/geometry/

RUN mkdir /tmp/matplotlib
ENV MPLCONFIGDIR=/tmp/matplotlib
RUN chown -R ava:ava $MPLCONFIGDIR
USER ava


# When image is run, run the code with the environment
# activated:
SHELL ["/bin/bash", "-c"]

ENTRYPOINT source /env/bin/activate && \
           gunicorn -b 0.0.0.0:5001 app:app

