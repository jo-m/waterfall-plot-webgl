class Audio {
    constructor(fft_size, min_freq_hz, max_freq_hz) {
        this.fft_size = fft_size;
        this.min_freq_hz = min_freq_hz;
        this.max_freq_hz = max_freq_hz;

        this.context        = null;
        this.analyser       = null;
        this.input          = null;
        this.input_point    = null;
        this.freq_byte_data = null;
        this.fft_window_size  = {
            from: null,
            to:   null
        };
    }

    get_current_audio_data() {
        this.analyser.getByteFrequencyData(this.freq_byte_data);
        return this.freq_byte_data.subarray(
            this.fft_window_size.from, this.fft_window_size.to);
    }

    got_stream(stream) {
        this.input_point = this.context.createGain();
        this.input = this.context.createMediaStreamSource(stream);
        this.input.connect(this.input_point);

        this.analyser = this.context.createAnalyser();
        this.analyser.fft_size = this.fft_size;
        this.freq_byte_data = new Uint8Array(this.analyser.frequencyBinCount);
        this.input_point.connect(this.analyser);
    }

    get_fft_window_size() {
        let maxFreq = this.context.sampleRate / 2;
        let sizePerFreq = this.fft_size / maxFreq;

        return {
            from: Math.floor(sizePerFreq * this.min_freq_hz),
            to: Math.floor(sizePerFreq * this.max_freq_hz)
        };
    }

    get_audio_data_size() {
        return this.fft_window_size.to - this.fft_window_size.from;
    }

    is_initialized() {
        return this.analyser !== null;
    }

    init() {
        this.context = new window.AudioContext();
        this.fft_window_size = this.get_fft_window_size();

        if (navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({audio: true, video: false})
                .then(this.got_stream.bind(this))
                .catch((err) => {
                    alert('Error getting audio ' + err);
                }
            );
        } else {
            alert('Error getting audio');
        }
    }
}
