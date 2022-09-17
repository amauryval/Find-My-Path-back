FROM condaforge/mambaforge:4.14.0-0 AS build

COPY environment.yml environment.yml

RUN mamba env create --prefix /env -f environment.yml \
    && conda clean --all --yes

FROM debian:stable-slim

# install graphtool dependiencies
RUN apt-get update && apt install libgtk-3-0 -y
 #libgtk-3-dev -y

# Copy /venv from the previous stage:
COPY --from=build /env /env


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

