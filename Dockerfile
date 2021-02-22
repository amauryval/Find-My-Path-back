FROM continuumio/miniconda3

# for graphtool
RUN apt-get update
RUN apt install libgtk-3-0 libgtk-3-dev -y

# prepare app directory
COPY environment.yml /home/app/
WORKDIR /home/app/

# conda env creation
RUN conda env create -f environment.yml
RUN echo "source activate find_my_path" > ~/.bashrc
ENV PATH /opt/conda/envs/find_my_path/bin:$PATH

COPY . /home/app/

EXPOSE 5000
ENTRYPOINT ["python"]
CMD ["main.py"]
